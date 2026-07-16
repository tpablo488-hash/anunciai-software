import type { AnalyzeResult } from "@/lib/anuncia.functions";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./CopyButton";
import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export function AnalysisResult({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-5">
      <section className="surface-card p-5">
        <h4 className="font-semibold mb-2">Análise do título</h4>
        <p className="text-sm text-foreground/90 leading-relaxed">{result.tituloAnalise}</p>
      </section>

      <section className="surface-card p-5">
        <h4 className="font-semibold mb-2">Análise da descrição</h4>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{result.descricaoAnalise}</p>
      </section>

      <section className="surface-card p-5">
        <h4 className="font-semibold mb-2">SEO</h4>
        <p className="text-sm text-foreground/90 leading-relaxed">{result.seo}</p>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Palavras-chave recomendadas</h4>
          <CopyButton value={result.palavrasChave.join(", ")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {result.palavrasChave.map((k, i) => (
            <Badge key={i} variant="secondary" className="font-normal">{k}</Badge>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="surface-card p-5">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-4 w-4" /> Pontos fortes
          </h4>
          <ul className="space-y-1.5 text-sm">
            {result.pontosFortes.map((p, i) => (
              <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{p}</li>
            ))}
          </ul>
        </section>
        <section className="surface-card p-5">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" /> Pontos fracos
          </h4>
          <ul className="space-y-1.5 text-sm">
            {result.pontosFracos.map((p, i) => (
              <li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{p}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-card p-5">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary">
          <Lightbulb className="h-4 w-4" /> Sugestões de melhoria
        </h4>
        <ul className="space-y-1.5 text-sm">
          {result.sugestoes.map((s, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">→</span>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
