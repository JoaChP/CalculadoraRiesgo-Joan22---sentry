// public/src/sentry-boot.js
import * as Sentry from '@sentry/browser';
import { replayIntegration } from '@sentry/replay';
import { captureConsoleIntegration } from '@sentry/integrations';

// 🔐 TU DSN (el tuyo real, ya reemplazado)
const DSN = 'https://9f73ebcd503ecdb650d346e03e56bc14@o4507908867162112.ingest.us.sentry.io/4509968922247168';

Sentry.init({
  dsn: DSN,

  environment: import.meta.env.MODE === 'development' ? 'development' : 'production',
  release: 'calc-riesgo@1.0.0',

  // 🔎 Performance (tracing)
  tracesSampleRate: 1.0,

  // 🤳 Session Replay
  integrations: [
    replayIntegration({ maskAllInputs: false, blockAllMedia: false }),

    // 📝 Capturar console.* como Logs (si no existe en tu SDK, ver comentario abajo)
    captureConsoleIntegration({
      levels: ['log', 'info', 'warn', 'error', 'debug', 'trace', 'assert']
    })
  ],

  // Filtra logs si quieres (opcional)
  beforeSendLog(log) {
    // Ejemplo: ignora DEBUG
    if (log.level === 'debug') return null;
    return log;
  },

  // Replays
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Dejo Sentry en window por si quieres usarlo desde app.js
window.Sentry = Sentry;

/*
  NOTA sobre la integración de consola:
  - Si tu versión exacta del SDK cambiara y esta función no existe,
    cambia la línea de captureConsoleIntegration por UNA de estas alternativas:

  // A) (algunas variantes v8)
  // import { consoleIntegration } from '@sentry/integrations';
  // consoleIntegration({ levels: ['log','info','warn','error','debug','trace','assert'] })

  // B) API vieja (v7)
  // new Sentry.Integrations.CaptureConsole({ levels: ['log','info','warn','error','debug'] })

  Y deja todo lo demás igual.
*/
