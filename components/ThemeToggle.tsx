"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const ORDER: Mode[] = ["system", "light", "dark"];
const LABEL: Record<Mode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

function applyMode(mode: Mode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode === "light") root.classList.add("light");
  if (mode === "dark") root.classList.add("dark");
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("coder-theme") as Mode) || "system";
    setMode(saved);
    applyMode(saved);
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    applyMode(next);
    localStorage.setItem("coder-theme", next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="rounded-full border border-line-strong bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-horizonte"
      aria-label="Cambiar tema"
    >
      {mounted ? `Tema: ${LABEL[mode]}` : "Tema"}
    </button>
  );
}
