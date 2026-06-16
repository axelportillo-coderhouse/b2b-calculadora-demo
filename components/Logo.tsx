export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-btn text-surface">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 7 4 12 9 17" />
          <polyline points="15 7 20 12 15 17" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Coderhouse
        <span className="ml-1.5 font-semibold text-muted">Empresas</span>
      </span>
    </div>
  );
}
