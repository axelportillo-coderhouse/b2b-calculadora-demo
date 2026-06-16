# Calculadora de capacitaciones B2B — Coderhouse (demo)

Herramienta aislada para que una empresa cotice cursos, carreras y workshops
para su equipo en segundos, reemplazando el ida y vuelta por mail de las
**Etapas 1 y 2** del proceso actual (entrada de la consulta + cotización).

Pensada como pieza independiente para presentar al equipo B2B y luego integrar
al producto. **No tiene login ni registro.**

## Qué hace

1. La empresa completa sus datos (nombre, email, empresa, sitio web), elige
   región (Argentina / Exterior), selecciona uno o más productos e indica
   cuántas personas por producto.
2. Al apretar **Calcular**, muestra una estimación con la cascada de descuentos.
3. Al mismo tiempo dispara un **aviso al equipo B2B** para el seguimiento
   (simulado en la demo — ver más abajo).

## Lógica de precios

Basada en la sección "Precios" del registro de proceso. Sobre el precio de
lista se aplica, en cascada multiplicativa:

| Descuento | Argentina | Exterior |
|---|---|---|
| Web vigente | 20% | 60% |
| Corporativo (10+ cupos totales) | +5% | — |
| Alianzas (con código) | +20% | — |

- **Argentina** → ARS · transferencia a 30 días.
- **Exterior** → USD · tarjeta vía link de pago.
- Código de Alianzas válido para la demo: `ALIANZAS20` o `CODER-ALIANZA`.

Todo está parametrizado en [`lib/pricing.ts`](lib/pricing.ts) (porcentajes,
umbral de cupos, códigos válidos) y el catálogo en
[`lib/catalog.ts`](lib/catalog.ts) (productos y precios de lista, **datos de
ejemplo** fáciles de editar).

## Correr la demo

```bash
npm install
npm run dev
# http://localhost:3000
```

## Publicar la demo en GitHub Pages (sitio estático)

Un solo flag (`NEXT_PUBLIC_DEMO=1`) cambia la app de "llama al backend" a
"usa datos del lado del cliente": misma UI, mismo flujo, solo cambia de dónde
salen los datos. Después se exporta como sitio 100% estático.

**La frontera de datos** está en [`lib/api.ts`](lib/api.ts): toda la UI pasa
por `api.submitQuote()`. En modo real llama a `/api/quote`; en modo demo simula
la respuesta en el cliente sin tocar la red. Es el único punto que cambia.
El cálculo de precios ya corre 100% en el cliente, así que funciona igual.

**El export estático** se gatea en [`next.config.mjs`](next.config.mjs): solo
con el flag activa `output: "export"` (genera `/out`, sin servidor). En dev
normal no toca nada. El route handler `/api/quote` se excluye del export
automáticamente (en demo no se usa).

### Build

```bash
npm run build:demo                      # basePath = /<nombre-del-repo>
BASE_PATH=/mi-subpath npm run build:demo
```

Genera `./out` con un `.nojekyll` (necesario para que Pages sirva `_next/`).
El `basePath` debe igualar el subpath del repo en Pages
(`https://<usuario>.github.io/<repo>/`).

### Deploy (código fuente privado, solo el build es público)

El fuente queda en este repo (privado). A Pages se sube **solo `./out`** (los
bundles compilados) a un repo público aparte:

```bash
DEPLOY_REPO=git@github.com:usuario/b2b-calculadora-demo.git npm run deploy:demo
```

Luego en el repo público: **Settings → Pages → Branch: `gh-pages` / (root)**.

> Export estático = sin SSR ni API routes en runtime: todo renderiza en cliente.
> Por eso el aviso B2B se simula en demo (no hay server al que llamar).

## El aviso al equipo B2B (simulado)

El endpoint [`app/api/quote/route.ts`](app/api/quote/route.ts) recibe la
consulta y, en la demo, solo la loguea en el servidor y devuelve un ticket.
El punto de integración real (Resend / SMTP / alta en CRM) está marcado con un
comentario `--- Punto de integración real ---` dentro del archivo.

## Sistema de diseño

Estilos de marca Coderhouse con Tailwind v4: tokens semánticos claro/oscuro en
[`app/globals.css`](app/globals.css), fuente Plus Jakarta Sans, gradiente de
marca `.brand-horizon`. Los componentes nunca usan hex crudos — siempre tokens
(`bg-surface`, `text-ink`, `border-line`…), así el tema claro/oscuro se da
vuelta solo. El toggle de tema (arriba a la derecha) cicla Sistema / Claro /
Oscuro.

> Demo interna. La estimación es orientativa; el equipo de empresas confirma el
> presupuesto final.
