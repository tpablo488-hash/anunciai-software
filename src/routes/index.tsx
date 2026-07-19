import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import { UploadPanel } from "@/components/anuncia/UploadPanel";
import { NewAdResult } from "@/components/anuncia/NewAdResult";
import { emptyAd, type AdInput } from "@/components/anuncia/types";
import {
  generateAd,
  enhanceImage,
  generateProductImage,
  type GenerateResult,
} from "@/lib/anuncia.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Anuncia.ai — Otimize anúncios de marketplaces com IA" },
      {
        name: "description",
        content:
          "Geração de anúncios profissionais para Mercado Livre, Shopee, Amazon e OLX com IA.",
      },
      { property: "og:title", content: "Anuncia.ai — Otimize anúncios de marketplaces com IA" },
      {
        property: "og:description",
        content:
          "Geração de anúncios profissionais para Mercado Livre, Shopee, Amazon e OLX com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

interface ImageState {
  url: string;
  loading?: boolean;
  error?: string;
}

function Index() {
  const [adN, setAdN] = useState<AdInput>(emptyAd);
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [images, setImages] = useState<ImageState[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [loadingN, setLoadingN] = useState(false);
  const generate = useServerFn(generateAd);
  const enhance = useServerFn(enhanceImage);
  const genImg = useServerFn(generateProductImage);

  function validate(ad: AdInput): boolean {
    if (!ad.product.trim() || !ad.category.trim() || !ad.marketplace) {
      toast.error("Preencha produto, categoria e marketplace.");
      return false;
    }
    return true;
  }

  async function onGenerate() {
    if (!validate(adN)) return;
    setLoadingN(true);
    setGenerated(null);
    setImages([]);
    try {
      const r = await generate({
        data: {
          product: adN.product,
          category: adN.category,
          marketplace: adN.marketplace,
          title: adN.title,
          description: adN.description,
          images: adN.images,
        },
      });
      setGenerated(r);
      toast.success("Novo anúncio gerado! Para visualizar, deslize a tela para baixo.");
      setTimeout(() => {
        document.getElementById("novo-resultado")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);

      setImgLoading(true);
      if (adN.images.length > 0) {
        const arr: ImageState[] = adN.images.map((u) => ({ url: u, loading: true }));
        setImages(arr);
        for (let i = 0; i < adN.images.length; i++) {
          try {
            const res = await enhance({ data: { image: adN.images[i] } });
            arr[i] = { url: res.image };
          } catch (err) {
            arr[i] = { url: adN.images[i], error: err instanceof Error ? err.message : "Falhou" };
          }
          setImages([...arr]);
        }
      } else {
        setImages([{ url: "", loading: true }]);
        try {
          const res = await genImg({
            data: { product: adN.product, title: r.titulo, description: r.descricao },
          });
          setImages([{ url: res.image }]);
        } catch (err) {
          setImages([{ url: "", error: err instanceof Error ? err.message : "Falha ao gerar imagem" }]);
        }
      }
      setImgLoading(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na geração.");
    } finally {
      setLoadingN(false);
    }
  }

  return (
    <div className="min-h-screen flex">
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
          <div className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sidebar-accent text-foreground">
            <FileText className="h-4 w-4" />
            Novo Anúncio
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-sidebar-border text-xs text-muted-foreground space-y-1">
          <div>Motor: Gemini + Nano Banana</div>
          <div className="opacity-70">Lovable AI Gateway</div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/70">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <img src="/logo.png" alt="Anuncia.ai" className="h-14 w-auto object-contain" />
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <UploadPanel
            value={adN}
            onChange={setAdN}
            onAnalyze={onGenerate}
            loading={loadingN}
            actionLabel="Gerar Novo Anúncio"
            loadingLabel="Gerando novo anúncio..."
          />
          {generated && (
            <div id="novo-resultado" className="scroll-mt-24">
              <h3 className="text-lg font-semibold mb-4">Novo anúncio</h3>
              <NewAdResult result={generated} images={images} imagesLoading={imgLoading} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
