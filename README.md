# Klozet 👕

Tu closet digital con IA, 100% gratis. React Native (Expo) + Supabase. La IA es **por plataforma**: en el teléfono (app nativa) usa IA **local** (rembg + Ollama); en la **PWA/web** usa IA **en la nube gratis** (fondo quitado en el propio navegador con @imgly, análisis y outfits con Pollinations).

## Qué hace
- **Auth** con Supabase (correo + contraseña) y perfil con tus medidas (altura, peso, pecho, cintura, cadera, tallas).
- **Sube una foto de una prenda** → la IA le quita el fondo, detecta tipo, tela/material, patrón, corte, colores (con hex), estilos y temporadas.
- **Vista 3D**: arrastra con el dedo para girar la prenda recortada.
- **Maniquí negro** escalado con tus medidas reales, vístelo tocando prendas.
- **Mi modelo**: sube fotos tuyas (frente/lado/espalda), la IA les quita el fondo y te pruebas la ropa sobre tu foto real (tu cara nunca se toca).
- **Try-on generativo** ✨: con tu foto + las prendas seleccionadas, la IA genera una imagen tuya con ese outfit puesto, preservando tu cara/identidad (Pollinations nanobanana/kontext, gratis con token).
- **Outfits con IA**: combina tu ropa por teoría del color y estilo (casual, formal, semiformal, estético, old money, streetwear, deportivo) con razón y puntuación.

## Puesta en marcha (una sola vez)
1. **Base de datos**: abre el SQL Editor de tu proyecto Supabase y pega `supabase/schema.sql` → Run.
   Si ya lo habías corrido antes, ejecuta también `supabase/002_model_photos.sql` y `supabase/003_storage_read_policy.sql`.
   (El bucket de storage `garments` ya está creado.)
2. **(Recomendado)** En Supabase → Authentication → Sign In / Providers → Email: desactiva **Confirm email** para entrar sin verificación.
3. **Token gratis para el try-on**: crea un token en `enter.pollinations.ai` (gratis, sin tarjeta) y pégalo en `.env` como `EXPO_PUBLIC_POLLINATIONS_TOKEN`. Habilita el generador de fotos y el análisis con visión en la PWA. Sin él, todo lo demás sigue funcionando.

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
