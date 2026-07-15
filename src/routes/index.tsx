import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Upload, Gauge, FileText, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UploadPanel } from "@/components/anuncia/UploadPanel";
import { ScorePanel } from "@/components/anuncia/ScorePanel";
import { NewAdPanel } from "@/components/anuncia/NewAdPanel";
import { ImagesPanel } from "@/components/anuncia/ImagesPanel";
import { emptyAd, type AdInput } from "@/components/anuncia/types";
import { analyzeAd, type AnalyzeResult } from "@/lib/anuncia.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anuncia.ai — Otimize anúncios de marketplaces com IA" },
      {
        name: "description",
        content:
          "Transforme anúncios comuns em anúncios profissionais para Mercado Livre, Shopee, Amazon e OLX. Análise, SEO, copy e imagens melhoradas por IA.",
      },
      { property: "og:title", content: "Anuncia.ai — Otimize anúncios de marketplaces com IA" },
      {
        property: "og:description",
        content:
          "Transforme anúncios comuns em anúncios profissionais para Mercado Livre, Shopee, Amazon e OLX. Análise, SEO, copy e imagens melhoradas por IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ad, setAd] = useState<AdInput>(emptyAd);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("upload");
  const analyze = useServerFn(analyzeAd);

  async function onAnalyze() {
    setLoading(true);
    try {
      const r = await analyze({
        data: {
          product: ad.product,
          category: ad.category,
          marketplace: ad.marketplace,
          title: ad.title,
          description: ad.description,
          images: ad.images,
        },
      });
      setResult(r);
      setTab("score");
      toast.success(`Análise concluída — Score ${r.scoreGeral}/100`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na análise.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/30">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-bold tracking-tight">Anuncia<span className="brand-gradient-text">.ai</span></div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">v1 · interno</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          {[
            { id: "upload", label: "Upload", icon: Upload },
            { id: "score", label: "Score", icon: Gauge, disabled: !result },
            { id: "novo", label: "Novo Anúncio", icon: FileText, disabled: !result },
            { id: "imagens", label: "Imagens", icon: ImageIcon, disabled: !result },
          ].map((n) => (
            <button
              key={n.id}
              disabled={n.disabled}
              onClick={() => setTab(n.id)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                tab === n.id ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-sidebar-border text-xs text-muted-foreground space-y-1">
          <div>Motor: Gemini + Nano Banana</div>
          <div className="opacity-70">Lovable AI Gateway</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/70">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <img src="/logo.png" alt="Anuncia.ai" className="h-14 w-auto object-contain" />
            </div>
            {result && (
              <div className="text-right">
                <div className="text-2xl font-bold tabular-nums brand-gradient-text">{result.scoreGeral}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Score atual</div>
              </div>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="score" disabled={!result}>Score</TabsTrigger>
              <TabsTrigger value="novo" disabled={!result}>Novo Anúncio</TabsTrigger>
              <TabsTrigger value="imagens" disabled={!result}>Imagens</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <UploadPanel value={ad} onChange={setAd} onAnalyze={onAnalyze} loading={loading} />
            </TabsContent>
            <TabsContent value="score">{result && <ScorePanel result={result} />}</TabsContent>
            <TabsContent value="novo">{result && <NewAdPanel result={result} />}</TabsContent>
            <TabsContent value="imagens">
              {result && <ImagesPanel originals={ad.images} prompt={result.promptImagem} />}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
