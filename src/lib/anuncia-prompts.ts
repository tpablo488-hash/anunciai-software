// Prompts profissionais para análise, SEO e geração de imagens.
// Mantidos em módulo separado para fácil ajuste sem tocar na lógica.

export const MARKETPLACE_GUIDE: Record<string, string> = {
  mercadolivre:
    "Mercado Livre: títulos de até 60 caracteres, começando por Marca + Modelo + Atributos-chave. Prioriza palavras exatas de busca, sem caixa alta exagerada nem emojis. Descrição valoriza escaneabilidade, especificações técnicas e garantia.",
  shopee:
    "Shopee: títulos podem ter até 100 caracteres, aceitam variações e sinônimos, funcionam bem com bullets e chamada emocional. Público mais impulsivo — CTA e benefícios claros aumentam conversão.",
  amazon:
    "Amazon: título até 200 caracteres, formato Marca + Linha + Recurso + Modelo + Tamanho/Cor. Bullets (5) são fundamentais, focados em benefícios. Descrição técnica, sem promessas.",
  olx: "OLX: título direto, sem repetição de palavras, foco em modelo, estado e localização. Descrição objetiva, com condição do produto, motivo da venda e forma de entrega.",
  outro:
    "Site próprio / marketplace genérico: título claro e otimizado para SEO Google (marca + produto + atributo). Descrição longa com estrutura AIDA e schema-friendly.",
};

export function buildAnalysisPrompt(input: {
  product: string;
  category: string;
  marketplace: string;
  title: string;
  description: string;
  imagesCount: number;
}) {
  const guide = MARKETPLACE_GUIDE[input.marketplace] ?? MARKETPLACE_GUIDE.outro;

  return `Você é um especialista sênior em SEO para marketplaces e copywriter de e-commerce com 10+ anos de experiência em Mercado Livre, Shopee, Amazon e OLX. Você domina AIDA, PAS, técnicas de persuasão, hierarquia de informação e escaneabilidade.

MARKETPLACE ALVO: ${input.marketplace}
DIRETRIZES DA PLATAFORMA:
${guide}

DADOS DO ANÚNCIO:
- Produto: ${input.product}
- Categoria: ${input.category}
- Título atual: ${input.title}
- Descrição atual: ${input.description}
- Imagens fornecidas: ${input.imagesCount}

TAREFA:
1) Analise texto E imagens (quando fornecidas).
2) Nunca invente especificações técnicas — se não estiver claro, escreva de forma genérica.
3) Aplique boas práticas do marketplace informado.
4) Retorne EXCLUSIVAMENTE um JSON válido no schema abaixo (sem markdown, sem comentários).

SCHEMA JSON:
{
  "scoreGeral": number (0-100),
  "scores": {
    "seo": number, "fotos": number, "titulo": number,
    "descricao": number, "persuasao": number,
    "conversao": number, "escaneabilidade": number
  },
  "comentarios": {
    "seo": string, "fotos": string, "titulo": string,
    "descricao": string, "persuasao": string,
    "conversao": string, "escaneabilidade": string
  },
  "problemas": string[] (5 a 8 itens, curtos e diretos),
  "titulos": string[] (exatamente 5 títulos otimizados, respeitando o limite do marketplace),
  "descricao": string (descrição completa profissional, com quebras \\n\\n, contendo: Introdução, Benefícios, Características, Especificações, Diferenciais, Garantia, CTA),
  "bullets": string[] (entre 5 e 10 bullets, começando com benefício antes de característica quando possível),
  "palavrasChave": string[] (10-20 keywords ordenadas por relevância de busca),
  "sugestoes": string[] (5-8 melhorias acionáveis para aumentar conversão),
  "promptImagem": string (prompt EM INGLÊS extremamente detalhado para editor de imagem IA — ver instruções abaixo)
}

INSTRUÇÕES PARA "promptImagem":
- Escreva em inglês, altamente descritivo.
- Peça: professional commercial product photography, studio lighting, clean white background OR premium studio backdrop, ultra-sharp focus, realistic color, high resolution, e-commerce ready.
- Enfatize: PRESERVE the original product exactly — do NOT alter brand, model, shape, logos, text, colors or physical characteristics.
- Peça: remove distracting background, correct exposure, boost clarity, subtle shadow for depth.
- Nunca peça para adicionar textos, selos, badges ou marcas d'água.
- 2 a 4 frases, denso e técnico.

Responda APENAS com o JSON.`;
}
