import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/fd0ec652-aab0-4a82-b8a9-3e364de135b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H1',location:'src/main.tsx:9',message:'App bootstrap context',data:{href:window.location.href,pathname:window.location.pathname,baseUrl:import.meta.env.BASE_URL,rootExists:Boolean(rootElement),scriptSrc:(document.querySelector('script[type="module"]') as HTMLScriptElement | null)?.src ?? null},timestamp:Date.now()})}).catch(()=>{});
// #endregion

window.addEventListener('error', (event) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd0ec652-aab0-4a82-b8a9-3e364de135b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H3',location:'src/main.tsx:14',message:'Window error captured',data:{message:event.message,filename:event.filename,lineno:event.lineno,colno:event.colno},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
});

window.addEventListener('unhandledrejection', (event) => {
  const reason =
    typeof event.reason === 'string'
      ? event.reason
      : event.reason && typeof event.reason === 'object'
        ? JSON.stringify(event.reason)
        : String(event.reason);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd0ec652-aab0-4a82-b8a9-3e364de135b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H4',location:'src/main.tsx:26',message:'Unhandled promise rejection',data:{reason},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
});

if (rootElement) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/fd0ec652-aab0-4a82-b8a9-3e364de135b4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H2',location:'src/main.tsx:32',message:'Rendering React root',data:{baseUrl:import.meta.env.BASE_URL},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
