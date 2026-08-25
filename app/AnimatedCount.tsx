"use client";

export function AnimatedCount({ className = "", value }: { className?: string; value?: number }) {
  if (value === undefined) return <strong className={className}>Loading</strong>;

  const label = value.toLocaleString();
  return <strong className={`${className} animated-count`.trim()} aria-label={label}>
    <span className="sr-only">{label}</span>
    {label.split("").map((character, index) => {
      if (character < "0" || character > "9") return <span className="count-separator" aria-hidden="true" key={`${character}-${index}`}>{character}</span>;
      return <span className="count-digit" aria-hidden="true" key={`${character}-${index}`}>
        <span className="count-reel" style={{ animationDelay: `${index * 70}ms` }}>
          {"0123456789".split("").map((digit) => <span key={digit}>{digit}</span>)}
          <span>{character}</span>
        </span>
      </span>;
    })}
  </strong>;
}
