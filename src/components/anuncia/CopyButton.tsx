import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          toast.success("Copiado!");
          setTimeout(() => setOk(false), 1500);
        } catch {
          toast.error("Não foi possível copiar.");
        }
      }}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="ml-1.5">{label}</span>
    </Button>
  );
}
