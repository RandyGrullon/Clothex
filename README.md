# Klozet 👕

Tu closet digital con IA, 100% gratis y local. React Native (Expo) + Supabase + Ollama.

## Qué hace
- **Auth** con Supabase (correo + contraseña) y perfil con tus medidas (altura, peso, pecho, cintura, cadera, tallas).
- **Sube una foto de una prenda** → la IA local le quita el fondo (rembg), detecta tipo, tela/material, patrón, corte, colores (con hex), estilos y temporadas (gemma3:12b visión).
- **Vista 3D**: arrastra con el dedo para girar la prenda recortada.
- **Maniquí** escalado con tus medidas reales, vístelo tocando prendas.
- **Outfits con IA**: combina tu ropa por teoría del color y estilo (casual, formal, semiformal, estético, old money, streetwear, deportivo) con razón y puntuación.

## Puesta en marcha (una sola vez)
1. **Base de datos**: abre el SQL Editor de tu proyecto Supabase y pega `supabase/schema.sql` → Run.
   (El bucket de storage `garments` ya está creado.)
2. **(Recomendado)** En Supabase → Authentication → Sign In / Providers → Email: desactiva **Confirm email** para entrar sin verificación.

## Uso diario
1. **IA local**: doble clic a `start-ai.bat` (necesita Ollama corriendo con `gemma3:12b`). La primera vez instala dependencias y descarga el modelo de segmentación.
2. **App**:
   - Web: `npm run web`
   - Teléfono: `npm start` y escanea el QR con Expo Go. En `.env` cambia `EXPO_PUBLIC_AI_URL` a la IP LAN de tu PC (ej. `http://192.168.1.50:8000`) para que el teléfono llegue a la IA.

## Estructura
- `src/app/` — pantallas (expo-router): auth, onboarding, closet, añadir prenda, detalle 3D, outfits, generador, maniquí, perfil.
- `src/lib/` — supabase, cliente IA, tipos, tema.
- `src/components/` — UI, tarjeta de prenda, visor 3D, maniquí SVG.
- `ai-server/` — FastAPI: `/process` (rembg + análisis con visión) y `/outfits` (estilista).
- `supabase/schema.sql` — tablas + RLS + políticas de storage.
