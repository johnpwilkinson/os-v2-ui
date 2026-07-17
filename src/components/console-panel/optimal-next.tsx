interface OptimalNextProps {
  directive: string;
  linkUp: boolean;
}

export function OptimalNext({ directive, linkUp }: OptimalNextProps) {
  const dotClasses = linkUp
    ? "inline-block size-2 bg-[#4AF626] shadow-[0_0_6px_#4AF626]"
    : "inline-block size-2 bg-[#E61919] shadow-[0_0_6px_#E61919]";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60">
          [ OPTIMAL NEXT ]
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60">
            LINK
          </span>
          <span className={dotClasses} />
        </span>
      </div>
      <div className="text-base [text-shadow:0_0_6px_rgba(234,234,234,0.22)]">
        {`>>> ${directive}`}
      </div>
    </div>
  );
}
