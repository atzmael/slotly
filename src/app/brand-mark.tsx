import Image from "next/image";

interface BrandMarkProps {
  readonly size?: "sm" | "md";
}

export function BrandMark({ size = "md" }: BrandMarkProps) {
  const imageSize = size === "sm" ? 24 : 32;
  const textSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-normal text-[var(--foreground)]">
      <Image
        alt=""
        aria-hidden="true"
        className="rounded-[7px]"
        height={imageSize}
        priority={size === "md"}
        src="/slotly-logo.png"
        width={imageSize}
      />
      <span className={textSize}>Slotly</span>
    </span>
  );
}
