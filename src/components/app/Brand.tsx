import { cn } from "@/lib/utils";

/** Trinova mark: navy tile, teal bars and a rising trend line. Matches public/icons/icon.svg. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("h-9 w-9 shrink-0", className)} aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#0f2445" />
      <rect x="120" y="300" width="56" height="100" rx="10" fill="#1aa3a8" opacity=".55" />
      <rect x="200" y="250" width="56" height="150" rx="10" fill="#1aa3a8" opacity=".75" />
      <rect x="280" y="200" width="56" height="200" rx="10" fill="#1aa3a8" />
      <path
        d="M110 250 L210 175 L270 205 L380 112"
        fill="none"
        stroke="#fff"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M332 104 L392 100 L388 160"
        fill="none"
        stroke="#fff"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
