import { cn } from "@/lib/utils";

interface Props {
  label: string;
  score: number;
  comment?: string;
}

function toneFor(score: number) {
  if (score >= 80) return { ring: "ring-[oklch(0.72_0.17_155)]", text: "text-[oklch(0.82_0.17_155)]", bar: "bg-[oklch(0.72_0.17_155)]" };
  if (score >= 60) return { ring: "ring-[oklch(0.78_0.15_75)]", text: "text-[oklch(0.85_0.15_75)]", bar: "bg-[oklch(0.78_0.15_75)]" };
  return { ring: "ring-destructive", text: "text-destructive", bar: "bg-destructive" };
}

export function ScoreCard({ label, score, comment }: Props) {
  const tone = toneFor(score);
  return (
    <div className={cn("surface-card p-4 flex flex-col gap-2 ring-1 ring-transparent transition-all hover:ring-2", tone.ring)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("text-2xl font-semibold tabular-nums", tone.text)}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full transition-all", tone.bar)} style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
      </div>
      {comment && <p className="text-xs text-muted-foreground leading-relaxed">{comment}</p>}
    </div>
  );
}
