// ============================================================
// Detección del país/región desde la URL.
//
// La herramienta va embebida (iframe) en la landing de Framer,
// cuya URL tiene el país: coderhouse.com/<pais>/empresas/...
//
// Buscamos el código de país en 3 fuentes, en orden:
//   1. Query param explícito del embed:  ?pais=ar (o country/lang)
//   2. El path de nuestra propia URL:     .../ar/...
//   3. El referrer (la página que nos embebe): de ahí sale el /ar/
//
// Mapeo a región: "ar" → Argentina (ARS); cualquier otro → Exterior (USD).
// ============================================================

import type { Region } from "./pricing";

/** Códigos de país de 2 letras donde opera Coderhouse (para validar). */
const KNOWN_COUNTRIES = new Set([
  "ar", "mx", "cl", "co", "pe", "uy", "es", "br",
  "bo", "py", "ec", "ve", "do", "cr", "gt", "pa",
]);

function countryFromPath(pathname: string): string | null {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return seg && KNOWN_COUNTRIES.has(seg) ? seg : null;
}

/** Devuelve el código de país detectado (ej "ar", "mx") o null. */
export function detectCountryCode(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Query param explícito
  const params = new URLSearchParams(window.location.search);
  const qp = (params.get("pais") || params.get("country") || params.get("lang") || "")
    .toLowerCase()
    .slice(0, 2);
  if (qp && KNOWN_COUNTRIES.has(qp)) return qp;

  // 2. Nuestro propio path
  const own = countryFromPath(window.location.pathname);
  if (own) return own;

  // 3. Referrer (página que embebe el iframe)
  if (document.referrer) {
    try {
      const ref = new URL(document.referrer);
      const c = countryFromPath(ref.pathname);
      if (c) return c;
    } catch {
      /* referrer inválido — ignorar */
    }
  }

  return null;
}

/** Región a partir del país detectado. Default: Argentina. */
export function detectRegion(): Region {
  const code = detectCountryCode();
  if (!code) return "AR";
  return code === "ar" ? "AR" : "EXT";
}
