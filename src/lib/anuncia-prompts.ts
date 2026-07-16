// Prompts para Análise de Anúncio e Geração de Novo Anúncio.

export const MARKETPLACE_GUIDE: Record<string, string> = {
  mercadolivre:
    "Mercado Livre: títulos de até 60 caracteres, Marca + Modelo + Atributos-chave, palavras exatas de busca, sem caixa alta nem emojis.",
  shopee:
    "Shopee: títulos até 100 caracteres, aceitam sinônimos e CTA emocional; bullets funcionam bem.",
  amazon:
    "Amazon: título até 200 caracteres, Marca + Linha + Recurso + Modelo + Tamanho/Cor; 5 bullets focados em benefícios.",
  olx: "OLX: título direto, sem repetição, foco em modelo/estado/localização; descrição objetiva.",
  outro:
    "Site próprio/genérico: título otimizado para SEO Google (marca + produto + atributo); descrição AIDA.",
};

interface AdBase {
  product: string;
  category: string;
  marketplace: string;
  title: string;
  description: string;
  imagesCount: number;
}

export function buildAnalysisPrompt(input: AdBase) {
  const guide = MARKETPLACE_GUIDE[input.marketplace] ?? MARKETPLACE_GUIDE.outro;
  return `Você é um especialista sênior em SEO para marketplaces e copywriting de e-commerce.

MARKETPLACE: ${input.marketplace}
DIRETRIZ: ${guide}

DADOS DO ANÚNCIO:
- Produto: ${input.product}
- Categoria: ${input.category}
- Título atual: ${input.title || "(vazio)"}
- Descrição atual: ${input.description || "(vazio)"}
- Imagens fornecidas: ${input.imagesCount}

TAREFA: Analise o anúncio (texto e imagens quando houver) e retorne EXCLUSIVAMENTE um JSON válido no schema:

{
  "tituloAnalise": string (análise crítica do título atual, 2-4 frases),
  "descricaoAnalise": string (análise crítica da descrição atual, 3-5 frases),
  "seo": string (avaliação de SEO no marketplace, 3-5 frases),
  "palavrasChave": string[] (10-15 keywords relevantes que o anúncio deveria conter),
  "pontosFortes": string[] (3-6 itens),
  "pontosFracos": string[] (3-6 itens),
  "sugestoes": string[] (5-8 melhorias acionáveis)
}

Não invente especificações. Responda APENAS com o JSON, sem markdown.`;
}

export function buildGeneratePrompt(input: AdBase) {
  const guide = MARKETPLACE_GUIDE[input.marketplace] ?? MARKETPLACE_GUIDE.outro;
  return `Você é copywriter sênior de e-commerce e especialista em SEO de marketplaces.

MARKETPLACE: ${input.marketplace}
DIRETRIZ: ${guide}

DADOS DE ENTRADA:
- Produto: ${input.product}
- Categoria: ${input.category}
- Título atual: ${input.title || "(vazio)"}
- Descrição atual: ${input.description || "(vazio)"}
- Imagens fornecidas: ${input.imagesCount}

TAREFA: Gere um NOVO anúncio otimizado. Retorne EXCLUSIVAMENTE um JSON válido:

{
  "titulo": string (título otimizado respeitando limite do marketplace),
  "descricao": string (descrição profissional completa com quebras \\n\\n: Introdução, Benefícios, Características, Especificações, Diferenciais, Garantia, CTA),
  "seo": string (explicação da estratégia de SEO aplicada, 3-5 frases),
  "bullets": string[] (exatamente 5 bullets, benefício + característica),
  "palavrasChave": string[] (exatamente 10 keywords ordenadas por relevância)
}

Não invente especificações técnicas. Responda APENAS com o JSON, sem markdown.`;
}

export function buildImagePrompt(input: { product: string; title: string; description: string }) {
  return `Professional commercial product photography of: ${input.product}. ${input.title}. ${input.description.slice(0, 400)}.
Studio lighting, clean white background, ultra-sharp focus, realistic color, high resolution, e-commerce ready, subtle shadow for depth. No text, no watermark, no badges.`;
}

export const IMAGE_ENHANCE_PROMPT = `Enhance this product photo for e-commerce: professional commercial product photography, studio lighting, clean white background, ultra-sharp focus, realistic color, high resolution, subtle shadow for depth. PRESERVE the original product exactly — do NOT alter brand, model, shape, logos, text, colors or physical characteristics. Remove distracting background, correct exposure, boost clarity. No added text, badges or watermarks.`;
