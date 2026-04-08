import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isVercel = !!process.env.VERCEL_URL || process.env.VERCEL === '1';
  // Vercel 默认部署在根路径；GitHub Pages 通常部署在 /volvo-new/ 子路径
  const base = env.VITE_BASE || (isVercel ? '/' : '/volvo-new/');
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      // #region agent log
      {
        name: 'agent-debug-request-logger',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const started = Date.now();

            // #region fix trailing slash for base
            // 运行时证据：GET `${baseWithoutSlash}` 返回 404；GET `${base}` 返回 200。
            // 预览/跳转可能会省略尾斜杠，导致静态资源与入口都对不上。
            const reqPath = (req.url || '').split('?')[0] || '';
            const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
            const baseWithoutSlash = base === '/' ? '/' : base.replace(/\/$/, '');
            if (baseWithSlash !== '/' && reqPath === baseWithoutSlash) {
              // #region agent log
              fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af6d99'},body:JSON.stringify({sessionId:'af6d99',runId:'pre-fix',hypothesisId:'H1',location:'vite.config.ts:29',message:'Redirect /volvo-new -> /volvo-new/',data:{reqUrl:req.url,reqPath,baseWithSlash,host:req.headers.host,referer:req.headers.referer},timestamp:Date.now()})}).catch(()=>{});
              // #endregion agent log
              res.statusCode = 302;
              res.setHeader('Location', baseWithSlash);
              res.end();
              return;
            }
            // #endregion fix trailing slash for base

            // #region agent log
            console.log('[agent-debug][H5] vite request', {
              method: req.method,
              url: req.url,
              host: req.headers.host,
              referer: req.headers.referer,
            });
            res.on('finish', () => {
              console.log('[agent-debug][H6] vite response', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                durMs: Date.now() - started,
              });
              // #region agent log
              fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'af6d99'},body:JSON.stringify({sessionId:'af6d99',runId:'pre-fix',hypothesisId:'H2',location:'vite.config.ts:44',message:'Response finished',data:{method:req.method,url:req.url,statusCode:res.statusCode,locationHeader:res.getHeader('Location') ?? null,host:req.headers.host,referer:req.headers.referer},timestamp:Date.now()})}).catch(()=>{});
              // #endregion agent log
            });
            // #endregion agent log
            fetch('http://127.0.0.1:7288/ingest/dbdc2c33-75d3-416a-ae77-97ee35b38cbf', {
              method: 'POST',
              headers: {'Content-Type': 'application/json', 'X-Debug-Session-Id': 'af6d99'},
              body: JSON.stringify({
                sessionId: 'af6d99',
                runId: 'pre-fix',
                hypothesisId: 'H5',
                location: 'vite.config.ts:configureServer',
                message: 'Vite received request',
                data: {
                  method: req.method,
                  url: req.url,
                  host: req.headers.host,
                  referer: req.headers.referer,
                  ua: req.headers['user-agent'],
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            next();
          });
        },
      },
      // #endregion agent log
    ],
    define: {
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY ?? ''),
      'process.env.DEEPSEEK_MODEL': JSON.stringify(env.DEEPSEEK_MODEL ?? ''),
      // Backward compatibility (if you still have OPENROUTER_* set)
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY ?? ''),
      'process.env.OPENROUTER_MODEL': JSON.stringify(env.OPENROUTER_MODEL ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
