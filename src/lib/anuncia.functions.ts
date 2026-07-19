import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildGeneratePrompt,
  buildImagePrompt,
  IMAGE_ENHANCE_PROMPT,
} from "./anuncia-prompts";

// ---------------------------------------------------------------------------
// Duas rotas de IA:
//   1) GEMINI_API_KEY (Google AI Studio) -> chamada direta à API oficial do Google.
//      Funciona em qualquer hospedagem (Vercel, Netlify, self-host a partir do GitHub).
//   2) LOVABLE_API_KEY -> Lovable AI Gateway. Provisionada automaticamente dentro
//      do ambiente Lovable (preview + *.lovable.app). NÃO existe fora do Lovable.
//
// Preferimos GEMINI_API_KEY quando presente para que o app funcione self-hosted.
// ---------------------------------------------------------------------------

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_TEXT_MODEL = "google/gemini-3-flash-preview";
const LOVABLE_IMAGE_MODEL = "google/gemini-2.5-flash-image"; // Nano Banana via Lovable

const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_TEXT_MODEL = "gemini-2.0-flash";
const GOOGLE_IMAGE_MODEL = "gemini-2.5-flash-image-preview"; // Nano Banana direto

const AdInputSchema = z.object({
  product: z.string().min(1),
  category: z.string().min(1),
  marketplace: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).max(10).default([]),
});


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
  // Tenta extrair a mensagem original da API do Google (formato: { error: { message, status } })
  let original = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    if (parsed?.error?.message) {
      original = parsed.error.status
        ? `${parsed.error.status}: ${parsed.error.message}`
        : parsed.error.message;
    }
  } catch {
    /* body não é JSON, mantém texto bruto */
  }
  original = original.slice(0, 600);

  if (status === 429)
    return new Error(
      `Quota do Gemini atingida (429). Mensagem original da API: ${original}. ` +
        `Verifique limites em https://aistudio.google.com/app/apikey (free tier tem quota baixa em gemini-2.0-flash e gemini-2.5-flash-image-preview).`,
    );
  if (status === 401 || status === 403)
    return new Error(`Chave GEMINI_API_KEY inválida ou sem permissão (${status}). API: ${original}`);
  return new Error(`Erro na API Gemini (${status}): ${original}`);
}

function missingKeyError(): Error {
  return new Error(
    "Nenhuma chave de IA configurada. Defina GEMINI_API_KEY (Google AI Studio) nas variáveis de ambiente do servidor.",
  );
}

/** Converte data:image/xxx;base64,yyyy -> { mimeType, data } */
function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Imagem inválida (esperado data URL base64).");
  return { mimeType: m[1], data: m[2] };
}

// ---------- GOOGLE DIRETO ----------

async function googleGenerateText(
  key: string,
  prompt: string,
  images: string[],
  jsonMode: boolean,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const img of images) {
    const { mimeType, data } = splitDataUrl(img);
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
  };
  if (jsonMode) {
    body.generationConfig = { responseMimeType: "application/json" };
  }
  const url = `${GOOGLE_BASE}/${GOOGLE_TEXT_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw humanizeError(res.status, await res.text());
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini não retornou texto.");
  return text;
}

async function googleGenerateImage(
  key: string,
  prompt: string,
  inputImage?: string,
): Promise<string> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (inputImage) {
    const { mimeType, data } = splitDataUrl(inputImage);
    parts.push({ inline_data: { mime_type: mimeType, data } });
  }
  const url = `${GOOGLE_BASE}/${GOOGLE_IMAGE_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
  });
  if (!res.ok) throw humanizeError(res.status, await res.text());
  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inline_data?: { mime_type: string; data: string } }> };
    }>;
  };
  const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inline_data)?.inline_data;
  if (!img) throw new Error("Gemini (Nano Banana) não retornou imagem.");
  return `data:${img.mime_type};base64,${img.data}`;
}

// ---------- LOVABLE GATEWAY ----------

async function lovableGenerateText(
  key: string,
  prompt: string,
  images: string[],
): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const img of images) content.push({ type: "image_url", image_url: { url: img } });
  const res = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOVABLE_TEXT_MODEL,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw humanizeError(res.status, await res.text());
  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

async function lovableGenerateImage(
  key: string,
  prompt: string,
  inputImage?: string,
): Promise<string> {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  if (inputImage) content.push({ type: "image_url", image_url: { url: inputImage } });
  const res = await fetch(LOVABLE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOVABLE_IMAGE_MODEL,
      modalities: ["image", "text"],
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw humanizeError(res.status, await res.text());
  const json = (await res.json()) as {
    choices: Array<{ message: { images?: Array<{ image_url: { url: string } }> } }>;
  };
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("Nano Banana não retornou imagem.");
  return url;
}

// ---------- ROTEADORES ----------

async function aiText(prompt: string, images: string[]): Promise<string> {
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) return googleGenerateText(gemini, prompt, images, true);
  const lovable = process.env.LOVABLE_API_KEY;
  if (lovable) return lovableGenerateText(lovable, prompt, images);
  throw missingKeyError();
}

async function aiImage(prompt: string, inputImage?: string): Promise<string> {
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) return googleGenerateImage(gemini, prompt, inputImage);
  const lovable = process.env.LOVABLE_API_KEY;
  if (lovable) return lovableGenerateImage(lovable, prompt, inputImage);
  throw missingKeyError();
}

// ---------- SERVER FUNCTIONS ----------

export const analyzeAd = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => AdInputSchema.parse(v))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const prompt = buildAnalysisPrompt({
      product: data.product,
      category: data.category,
      marketplace: data.marketplace,
      title: data.title,
      description: data.description,
      imagesCount: data.images.length,
    });
    const text = await aiText(prompt, data.images);
    return extractJson(text) as AnalyzeResult;
  });

export const generateAd = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => AdInputSchema.parse(v))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const prompt = buildGeneratePrompt({
      product: data.product,
      category: data.category,
      marketplace: data.marketplace,
      title: data.title,
      description: data.description,
      imagesCount: data.images.length,
    });
    const text = await aiText(prompt, data.images);
    return extractJson(text) as GenerateResult;
  });

const EnhanceInput = z.object({ image: z.string().min(10) });

export const enhanceImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => EnhanceInput.parse(v))
  .handler(async ({ data }): Promise<{ image: string }> => {
    const image = await aiImage(IMAGE_ENHANCE_PROMPT, data.image);
    return { image };
  });

const GenImgInput = z.object({
  product: z.string().min(1),
  title: z.string().default(""),
  description: z.string().default(""),
});

export const generateProductImage = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => GenImgInput.parse(v))
  .handler(async ({ data }): Promise<{ image: string }> => {
    const prompt = buildImagePrompt(data);
    const image = await aiImage(prompt);
    return { image };
  });
