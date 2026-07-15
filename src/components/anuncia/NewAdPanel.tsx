import { CopyButton } from "./CopyButton";
import type { AnalyzeResult } from "@/lib/anuncia.functions";
import { Badge } from "@/components/ui/badge";

export function NewAdPanel({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">5 títulos otimizados</h4>
          <CopyButton value={result.titulos.join("\n")} label="Copiar todos" />
        </div>
        <ol className="space-y-2">
          {result.titulos.map((t, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
              <span className="text-xs font-semibold text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 text-sm">{t}</span>
              <CopyButton value={t} label="" />
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Descrição completa</h4>
          <CopyButton value={result.descricao} />
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{result.descricao}</div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Bullet points</h4>
          <CopyButton value={result.bullets.map((b) => `• ${b}`).join("\n")} />
        </div>
        <ul className="space-y-1.5">
          {result.bullets.map((b, i) => (
            <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{b}</li>
          ))}
        </ul>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Palavras-chave</h4>
          <CopyButton value={result.palavrasChave.join(", ")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {result.palavrasChave.map((k, i) => (
            <Badge key={i} variant="secondary" className="font-normal">{k}</Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
