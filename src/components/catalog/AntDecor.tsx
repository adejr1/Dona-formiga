/** Formiguinha decorativa (Donna Formiga) — SVG leve */
export function AntTiny({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="28" cy="16" rx="10" ry="7" fill="#7c4a3a" opacity="0.85" />
      <ellipse cx="14" cy="16" rx="7" ry="5.5" fill="#8b5a47" />
      <circle cx="8" cy="15" r="3.5" fill="#6b3f32" />
      <path
        d="M6 12c-2-2-4-1-5 1M10 10c-1-3-3-3-5-2M12 20c-1 2-3 3-5 2"
        stroke="#5c3529"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M32 10c2-2 5-2 6 0M34 22c2 2 5 2 6 0"
        stroke="#5c3529"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="6" cy="14" r="0.8" fill="#2d1a14" />
    </svg>
  );
}

export function AntTrail({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 opacity-40 ${className}`}>
      <AntTiny className="w-8 h-5" />
      <AntTiny className="w-6 h-4 scale-x-[-1]" />
      <AntTiny className="w-7 h-4" />
    </div>
  );
}
