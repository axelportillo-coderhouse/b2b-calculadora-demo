import Calculator from "@/components/Calculator";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ---------- Top bar ---------- */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="brand-horizon pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-[0.18]" />
        <div className="relative mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <span className="inline-block rounded-full bg-tintor/10 px-3 py-1 text-xs font-semibold text-tintor">
            Coderhouse para empresas
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Calculá la capacitación de tu equipo en segundos
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted">
            Elegí los cursos, carreras y workshops, indicá cuántas personas y
            obtené una estimación con los descuentos por cantidad. Nuestro equipo
            de empresas te contacta para avanzar.
          </p>
        </div>
      </section>

      {/* ---------- Calculadora ---------- */}
      <main className="mx-auto max-w-5xl px-5 py-10">
        <Calculator />
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-6 text-center text-xs text-muted">
          Demo interna · Calculadora de capacitaciones B2B · Coderhouse
        </div>
      </footer>
    </div>
  );
}
