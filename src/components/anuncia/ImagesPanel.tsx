import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { enhanceImage } from "@/lib/anuncia.functions";

interface Props {
  originals: string[];
  prompt: string;
}

interface Pair {
  original: string;
  enhanced?: string;
  loading?: boolean;
  error?: string;
}

export function ImagesPanel({ originals, prompt }: Props) {
  const enhance = useServerFn(enhanceImage);
  const [pairs, setPairs] = useState<Pair[]>(() => originals.map((o) => ({ original: o })));
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  async function runAll() {
    if (!prompt) {
      toast.error("Análise não gerou prompt de imagem.");
      return;
    }
    setRunning(true);
    const next: Pair[] = originals.map((o) => ({ original: o, loading: true }));
    setPairs(next);
    for (let i = 0; i < originals.length; i++) {
      try {
        const r = await enhance({ data: { image: originals[i], prompt } });
        next[i] = { original: originals[i], enhanced: r.image };
      } catch (err) {
        next[i] = { original: originals[i], error: err instanceof Error ? err.message : "Falhou" };
        toast.error(`Imagem ${i + 1}: ${next[i].error}`);
      }
      setPairs([...next]);
      setProgress(Math.round(((i + 1) / originals.length) * 100));
    }
    setRunning(false);
    toast.success("Imagens processadas.");
  }

  function download(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  if (originals.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-sm text-muted-foreground">
        Envie imagens na aba <b>Upload</b> para gerar versões profissionais.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <h4 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Melhoria com Nano Banana</h4>
          <p className="text-sm text-muted-foreground mt-1">Fundo profissional, iluminação de estúdio e nitidez — preservando o produto.</p>
        </div>
        <Button onClick={runAll} disabled={running} size="lg">
          {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</> : "Melhorar todas"}
        </Button>
      </div>

      {running && <Progress value={progress} />}

      <div className="grid gap-4 md:grid-cols-2">
        {pairs.map((p, i) => (
          <div key={i} className="surface-card p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Imagem {i + 1}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">Original</div>
                <img src={p.original} alt="" className="aspect-square w-full object-cover rounded-lg bg-muted" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-muted-foreground">Melhorada</div>
                <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {p.enhanced ? (
                    <img src={p.enhanced} alt="" className="h-full w-full object-cover" />
                  ) : p.loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : p.error ? (
                    <span className="text-xs text-destructive px-2 text-center">{p.error}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Aguardando</span>
                  )}
                </div>
              </div>
            </div>
            {p.enhanced && (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => download(p.enhanced!, `anuncia-ai-${i + 1}.png`)}>
                <Download className="h-3.5 w-3.5" /> Baixar melhorada
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
