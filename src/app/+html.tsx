import { ScrollViewStyleReset } from 'expo-router/html';

// Documento HTML raíz para la exportación web de Expo Router.
// Aquí van las meta tags de PWA: sin ellas, el navegador no ofrece
// "instalar app" y en iOS/Android se ve como una pestaña normal.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#17150F" />
        <meta name="description" content="Tu closet digital con IA — organiza tu ropa, arma outfits y visualízalos en 3D." />

        {/* Instalable como PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS: se abre en pantalla completa, sin Safari UI */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Klozet" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
        <link rel="apple-touch-startup-image" href="/splash.png" />

        {/* Android/Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icons/icon-32.png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />

        {/* Evita el "flash" blanco de RN Web y el rebote de scroll del navegador */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: appLikeCss }} />
        {/* Service worker: solo fuera de localhost, para no pisar el hot-reload en dev */}
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const appLikeCss = `
  html, body, #root { height: 100%; background-color: #F7F6F2; overscroll-behavior: none; }
  body { -webkit-tap-highlight-color: transparent; overflow: hidden; }
  * { -webkit-touch-callout: none; }
  input, textarea { -webkit-user-select: text; user-select: text; }
  @media (prefers-color-scheme: dark) {
    html, body, #root { background-color: #17150F; }
  }
`;

const swRegisterScript = `
  if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
`;
