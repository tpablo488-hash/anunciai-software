import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildAnalysisPrompt } from "./anuncia-prompts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TEXT_MODEL = "google/gemini-3-flash-preview";
const IMAGE_MODEL = "google/gemini-2.5-flash-image"; // Nano Banana

const AnalyzeInput = z.object({
  product: z.string().min(1),
  category: z.string().min(1),
  marketplace: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).max(10).default([]), // data URLs
});

export type AnalyzeResult = {
  scoreGeral: number;
  scores: Record<string, number>;
  comentarios: Record<string, string>;
  problemas: string[];
  titulos: string[];
  descricao: string;
  bullets: string[];
  palavrasChave: string[];
  sugestoes: string[];
  promptImagem: string;
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta sem JSON.");
  return JSON.parse(raw.slice(start, end + 1));
}

export const analyzeAd = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => AnalyzeInput.parse(v))
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

    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    for (const img of data.images) {
      content.push({ type: "image_url", image_url: { url: img } });
    }

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos do Lovable AI esgotados. Adicione créditos no workspace.");
      throw new Error(`Erro no Gateway (${res.status}): ${body.slice(0, 400)}`);
    }

    const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    const parsed = extractJson(text) as AnalyzeResult;
    return parsed;
  });

const EnhanceInput = z.object({
  image: z.string().min(10), // data URL
  prompt: z.string().min(5),
});

export const enhanceImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => EnhanceInput.parse(v))
  .handler(async ({ data }): Promise<{ image: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor.");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: data.prompt },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Limite atingido no Nano Banana. Tente em instantes.");
      if (res.status === 402) throw new Error("Créditos esgotados.");
      throw new Error(`Erro no Nano Banana (${res.status}): ${body.slice(0, 400)}`);
    }

    const json = (await res.json()) as {
      choices: Array<{
        message: {
          images?: Array<{ image_url: { url: string } }>;
          content?: string;
        };
      }>;
    };

    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("Nano Banana não retornou imagem.");
    return { image: url };
  });
