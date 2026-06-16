// El modo demo exporta un sitio 100% estático para GitHub Pages.
// En dev/producción normal (sin el flag) no toca nada.
const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = isDemo
  ? {
      output: "export", // genera /out con HTML/JS, sin servidor
      basePath: basePath || undefined, // subpath del repo en Pages, ej "/b2b-calculadora-demo"
      assetPrefix: basePath || undefined,
      images: { unoptimized: true }, // sin Image Optimization en estático
      trailingSlash: true, // /index.html para GitHub Pages
    }
  : {};

export default nextConfig;
