import { CheckCircle2, AlertTriangle } from "lucide-react";
import { ScoreCard } from "./ScoreCard";
import type { AnalyzeResult } from "@/lib/anuncia.functions";

const LABELS: Array<[keyof AnalyzeResult["scores"], string]> = [
  ["seo", "SEO"],
  ["fotos", "Fotos"],
  ["titulo", "Título"],
  ["descricao", "Descrição"],
  ["persuasao", "Persuasão"],
  ["conversao", "Conversão"],
  ["escaneabilidade", "Escaneabilidade"],
];

export function ScorePanel({ result }: { result: AnalyzeResult }) {
  const s = result.scoreGeral;
  const ringColor = s >= 80 ? "oklch(0.72 0.17 155)" : s >= 60 ? "oklch(0.78 0.15 75)" : "oklch(0.65 0.24 25)";

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex flex-col sm:flex-row items-center gap-6">
        <div
          className="relative h-32 w-32 rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${ringColor} ${s * 3.6}deg, oklch(0.22 0.012 260) 0deg)` }}
        >
          <div className="absolute inset-2 rounded-full bg-card flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">{s}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold">Score Geral do Anúncio</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Análise multidimensional gerada por IA a partir do texto e das imagens fornecidas.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LABELS.map(([k, label]) => (
          <ScoreCard key={k} label={label} score={result.scores[k] ?? 0} comment={result.comentarios[k]} />
        ))}
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-[oklch(0.78_0.15_75)]" />
          <h4 className="font-semibold">Problemas encontrados</h4>
        </div>
        <ul className="space-y-2">
          {result.problemas.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-[oklch(0.78_0.15_75)] mt-0.5">✗</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-[oklch(0.72_0.17_155)]" />
          <h4 className="font-semibold">Sugestões de melhoria</h4>
        </div>
        <ul className="space-y-2">
          {result.sugestoes.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-[oklch(0.72_0.17_155)] mt-0.5">→</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
