import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// #region agent log
(() => {
  const runId = 'pre-fix';
  fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af6d99' },
    body: JSON.stringify({
      sessionId: 'af6d99',
      runId,
      hypothesisId: 'H0',
      location: 'src/main.tsx:bootstrap',
      message: 'App bootstrap location info',
      data: {
        href: window.location.href,
        pathname: window.location.pathname,
        baseURI: document.baseURI,
        origin: window.location.origin,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});

  window.addEventListener(
    'error',
    (e) => {
      const target = e.target as any;
      const isResource = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG');
      fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af6d99' },
        body: JSON.stringify({
          sessionId: 'af6d99',
          runId,
          hypothesisId: 'H1',
          location: 'src/main.tsx:window.error',
          message: 'Window error event',
          data: {
            isResource,
            message: (e as any).message,
            filename: (e as any).filename,
            lineno: (e as any).lineno,
            colno: (e as any).colno,
            tagName: target?.tagName,
            src: target?.src,
            href: target?.href,
            currentSrc: target?.currentSrc,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    },
    true,
  );

  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const method = init?.method ?? ((input as any)?.method || 'GET');
    const isApi = url.includes('/api/');
    const start = Date.now();
    try {
      const res = await origFetch(input as any, init as any);
      if (isApi) {
        fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af6d99' },
          body: JSON.stringify({
            sessionId: 'af6d99',
            runId,
            hypothesisId: 'H2',
            location: 'src/main.tsx:fetch',
            message: 'Fetch completed',
            data: { url, method, status: res.status, ok: res.ok, durMs: Date.now() - start },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      return res;
    } catch (err: any) {
      if (isApi) {
        fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af6d99' },
          body: JSON.stringify({
            sessionId: 'af6d99',
            runId,
            hypothesisId: 'H2',
            location: 'src/main.tsx:fetch',
            message: 'Fetch failed',
            data: { url, method, errName: err?.name, errMsg: String(err?.message ?? err) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      throw err;
    }
  };
})();
// #endregion agent log

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
