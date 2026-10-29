import { cn } from "@/lib/utils";

/** Trinova symbol (the "T" with rising bars), transparent so it sits on any background. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/trinova-mark.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("h-9 w-9 shrink-0 object-contain", className)}
    />
  );
}

export function BrandName({ className, subtle }: { className?: string; subtle?: boolean }) {
  return (
    <div className={cn("leading-tight", className)}>
      <p className="font-display text-[15px] font-bold tracking-tight">Trinova Analytics</p>
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.14em]",
          subtle ? "opacity-60" : "opacity-70",
        )}
      >
        Vendor Scorecard
      </p>
    </div>
  );
}
