---
name: website-3d
description: |
  Crear landing pages cinematicas estilo Apple con scroll-driven video animation.
  Frame sequence en canvas, copy AIDA/PAS, starscape, glass-morphism, snap-stop.

  Usar cuando: "landing page", "pagina de venta", "scroll animation",
  "Apple-style scroll", "video on scroll", "necesito una landing", "website 3d".

  Requiere: FFmpeg instalado, video del usuario (3-10 seg).
---

# Website 3D — Landing Page Builder (Referencia)

> Usar para crear landing pages cinematicas de venta o marketing.

## Tecnica Core

1. Extraer frames del video con FFmpeg -> JPEGs
2. Precargar frames como imagenes
3. Dibujar en canvas segun posicion de scroll
4. Overlay: annotation cards con snap-stop

## Secciones del Sitio

```
Starscape -> Loader -> Navbar (pill) -> Hero (dolor+CTA)
-> Scroll Animation (canvas+cards) -> Specs (count-up)
-> Features (glass cards) -> CTA (FOMO) -> Footer
```

## Entrevista Obligatoria (antes de construir)

1. Marca: nombre, logo, color accent, fondo, vibe
2. Conversion: lead capture / contacto / cita / venta
3. Psicologia: dolor principal, FOMO, beneficio magico
4. Contenido: URL existente o texto directo
5. Opcionales: testimonios, confetti, Three.js card scanner

## Copy Framework

- **AIDA**: Atencion (dolor) -> Interes (features) -> Deseo (beneficio) -> Accion (FOMO)
- **PAS**: Problema -> Agitacion -> Solucion

## Casos de Uso

- Landing page de venta del producto/servicio
- Paginas de campana de marketing
- Micrositios para lanzamientos
- Landing pages para ads (Meta, Google)
