import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildAnalysisPrompt,
  buildGeneratePrompt,
  buildImagePrompt,
  IMAGE_ENHANCE_PROMPT,
} from "./anuncia-prompts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-2.5-flash-image"; // Nano Banana

const AdInputSchema = z.object({
  product: z.string().min(1),
  category: z.string().min(1),
  marketplace: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).max(10).default([]),
});

export type AnalyzeResult = {
  tituloAnalise: string;
  descricaoAnalise: string;
  seo: string;
  palavrasChave: string[];
  pontosFortes: string[];
  pontosFracos: string[];
  sugestoes: string[];
};

export type GenerateResult = {
  titulo: string;
  descricao: string;
  seo: string;
  bullets: string[];
  palavrasChave: string[];
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta sem JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

function humanizeError(status: number, body: string): Error {
  if (status === 429)
    return new Error("Muitas requisições. Aguarde alguns segundos e tente novamente.");
  if (status === 402)
    return new Error("Créditos do Lovable AI esgotados. Adicione créditos no workspace.");
  return new Error(`Erro na IA (${status}): ${body.slice(0, 300)}`);
}

async function callGeminiText(key: string, prompt: string, images: string[]): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const img of images) content.push({ type: "image_url", image_url: { url: img } });

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw humanizeError(res.status, await res.text());
  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

export const analyzeAd = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => AdInputSchema.parse(v))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");
    const prompt = buildAnalysisPrompt({
      product: data.product,
      category: data.category,
      marketplace: data.marketplace,
      title: data.title,
      description: data.description,
      imagesCount: data.images.length,
    });
    const text = await callGeminiText(key, prompt, data.images);
    return extractJson(text) as AnalyzeResult;
  });

export const generateAd = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => AdInputSchema.parse(v))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");
    const prompt = buildGeneratePrompt({
      product: data.product,
      category: data.category,
      marketplace: data.marketplace,
      title: data.title,
      description: data.description,
      imagesCount: data.images.length,
    });
    const text = await callGeminiText(key, prompt, data.images);
    return extractJson(text) as GenerateResult;
  });

const EnhanceInput = z.object({ image: z.string().min(10) });

export const enhanceImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => EnhanceInput.parse(v))
  .handler(async ({ data }): Promise<{ image: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: IMAGE_ENHANCE_PROMPT },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw humanizeError(res.status, await res.text());
    const json = (await res.json()) as {
      choices: Array<{ message: { images?: Array<{ image_url: { url: string } }> } }>;
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("Nano Banana não retornou imagem.");
    return { image: url };
  });

const GenImgInput = z.object({
  product: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
});

export const generateProductImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => GenImgInput.parse(v))
  .handler(async ({ data }): Promise<{ image: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");
    const prompt = buildImagePrompt(data);
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      }),
    });
    if (!res.ok) throw humanizeError(res.status, await res.text());
    const json = (await res.json()) as {
      choices: Array<{ message: { images?: Array<{ image_url: { url: string } }> } }>;
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("Nano Banana não retornou imagem.");
    return { image: url };
  });
