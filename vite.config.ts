import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Lokal: /api/* wie auf Vercel über die Dateien in /api bedienen (Web-Request → Response). */
function localApi(): Plugin {
  return {
    name: 'vela-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const m = url.match(/^\/api\/([a-z-]+)/);
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.ts`);
          const handler = mod[req.method || 'GET'];
          if (typeof handler !== 'function') { res.statusCode = 405; return res.end(); }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const request = new Request(`http://${req.headers.host}${url}`, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String(e));
          res.statusCode = 404;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { host: true },
});
