import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const response = await fetch('/sw.js', { cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok || !/(javascript|ecmascript)/i.test(contentType)) {
        console.warn('Skipping SW registration because /sw.js is unavailable or served with the wrong MIME type.', {
          status: response.status,
          contentType,
        });
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg);
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}
