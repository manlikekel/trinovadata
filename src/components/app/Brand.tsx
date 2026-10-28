import { cn } from "@/lib/utils";

/** Trinova symbol (the "T" with rising bars) on a white tile, like the app icon. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[22%] bg-white",
        className,
      )}
    >
      <img
        src="/brand/trinova-mark.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-[76%] w-[76%] object-contain"
      />
    </span>
  );
}

/**
 * Full stacked logo: symbol, "TRINOVA" and "ANALYTICS LIMITED".
 * `onDark` uses white lettering for navy backgrounds.
 */
export function BrandLogo({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <img
      src={onDark ? "/brand/trinova-logo-on-dark.png" : "/brand/trinova-logo.png"}
      alt="Trinova Analytics Limited"
      draggable={false}
      className={cn("h-24 w-auto object-contain", className)}
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
