import { useCallback, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { AdInput } from "./types";

const MAX_IMAGES = 10;
const MAX_SIZE = 6 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

interface Props {
  value: AdInput;
  onChange: (v: AdInput) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export function UploadPanel({ value, onChange, onAnalyze, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remaining = MAX_IMAGES - value.images.length;
      const accepted: string[] = [];
      for (const f of arr.slice(0, remaining)) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > MAX_SIZE) {
          toast.warning(`${f.name} passou de 6MB e foi ignorada.`);
          continue;
        }
        accepted.push(await readAsDataUrl(f));
      }
      if (accepted.length) onChange({ ...value, images: [...value.images, ...accepted] });
    },
    [value, onChange],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Produto</Label>
          <Input placeholder="Ex.: Fone Bluetooth JBL Tune 510BT" value={value.product} onChange={(e) => onChange({ ...value, product: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Input placeholder="Eletrônicos, Moda, Casa..." value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Marketplace</Label>
            <Select value={value.marketplace} onValueChange={(v) => onChange({ ...value, marketplace: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="olx">OLX</SelectItem>
                <SelectItem value="outro">Outro / Site próprio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Título atual</Label>
          <Input placeholder="Cole o título original do anúncio" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Descrição atual</Label>
          <Textarea rows={7} placeholder="Cole a descrição original" value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={!canSubmit || loading}
          onClick={onAnalyze}
        >
          {loading ? "Analisando com IA..." : "Analisar anúncio"}
        </Button>
      </div>

      <div className="space-y-3">
        <Label>Imagens do produto ({value.images.length}/{MAX_IMAGES})</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer surface-card border-dashed p-8 flex flex-col items-center justify-center gap-3 text-center hover:border-primary/50 transition-colors min-h-[220px]"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Arraste imagens aqui ou clique para enviar</p>
            <p className="text-xs text-muted-foreground mt-1">Até {MAX_IMAGES} imagens • até 6MB cada</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </div>

        {value.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {value.images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => onChange({ ...value, images: value.images.filter((_, j) => j !== i) })}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remover imagem"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {value.images.length === 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Fotos ajudam a IA a avaliar qualidade visual.
          </p>
        )}
      </div>
    </div>
  );
}
