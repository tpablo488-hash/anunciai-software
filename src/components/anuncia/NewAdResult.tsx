import type { GenerateResult } from "@/lib/anuncia.functions";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./CopyButton";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  result: GenerateResult;
  images: { url: string; loading?: boolean; error?: string }[];
  imagesLoading: boolean;
}

export function NewAdResult({ result, images, imagesLoading }: Props) {
  function download(url: string, i: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `anuncia-ai-${i + 1}.png`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Título otimizado</h4>
          <CopyButton value={result.titulo} />
        </div>
        <p className="text-sm text-foreground/90">{result.titulo}</p>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Descrição otimizada</h4>
          <CopyButton value={result.descricao} />
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{result.descricao}</div>
      </section>

      <section className="surface-card p-5">
        <h4 className="font-semibold mb-2">SEO aplicado</h4>
        <p className="text-sm text-foreground/90 leading-relaxed">{result.seo}</p>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">5 bullet points</h4>
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
          <h4 className="font-semibold">10 palavras-chave</h4>
          <CopyButton value={result.palavrasChave.join(", ")} />
        </div>
        <div className="flex flex-wrap gap-2">
          {result.palavrasChave.map((k, i) => (
            <Badge key={i} variant="secondary" className="font-normal">{k}</Badge>
          ))}
        </div>
      </section>

      {(imagesLoading || images.length > 0) && (
        <section className="surface-card p-5">
          <h4 className="font-semibold mb-3">Imagens</h4>
          {imagesLoading && images.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando imagens com Nano Banana...
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {images.map((img, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {img.loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : img.error ? (
                    <span className="text-xs text-destructive px-2 text-center">{img.error}</span>
                  ) : (
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                {!img.loading && !img.error && (
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => download(img.url, i)}>
                    <Download className="h-3.5 w-3.5" /> Baixar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
