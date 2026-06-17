import Calculator from "@/components/Calculator";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ---------- Encabezado de la sección ---------- */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-8 text-center sm:px-10 sm:pt-24 lg:px-12">
        <h1 className="mx-auto max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          Calculá la capacitación de tu equipo en&nbsp;segundos
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted">
          Elegí los cursos, carreras y workshops, indicá cuántas personas y
          obtené una estimación con los descuentos por cantidad. Nuestro equipo
          de empresas te contacta para avanzar.
        </p>
      </section>

      {/* ---------- Calculadora ---------- */}
      <main className="mx-auto max-w-5xl px-6 pb-16 sm:px-10 lg:px-12">
        <Calculator />
      </main>
    </div>
  );
}
