import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Vite plugin for model upload/delete API (dev only)
function modelApiPlugin() {
  const modelsDir = path.resolve(__dirname, 'public/models');
  const manifestPath = path.join(modelsDir, 'manifest.json');

  function readManifest() {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      return [];
    }
  }

  function writeManifest(data) {
    fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2));
  }

  return {
    name: 'model-api',
    configureServer(server) {
      server.middlewares.use('/api/upload-model', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const chunks = [];
        const boundary = req.headers['content-type']?.split('boundary=')[1];
        if (!boundary) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'No boundary in content-type' }));
          return;
        }

        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const parts = body.toString('binary').split('--' + boundary);
            let label = '', format = '', fileData = null, fileName = '';

            for (const part of parts) {
              if (part.includes('name="label"')) {
                label = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim() || '';
              }
              if (part.includes('name="file"') || part.includes('name="model"')) {
                const fnMatch = part.match(/filename="([^"]+)"/);
                if (fnMatch) fileName = fnMatch[1];
                const ext = path.extname(fileName).toLowerCase().replace('.', '');
                format = ext;
                const headerEnd = part.indexOf('\r\n\r\n') + 4;
                const dataEnd = part.lastIndexOf('\r\n');
                fileData = Buffer.from(part.substring(headerEnd, dataEnd), 'binary');
              }
            }

            if (!fileData || !fileName) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'No file uploaded' }));
              return;
            }

            const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const id = path.parse(safeName).name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            const finalLabel = label || path.parse(safeName).name;

            fs.writeFileSync(path.join(modelsDir, safeName), fileData);

            const manifest = readManifest();
            const existing = manifest.findIndex(m => m.id === id);
            const entry = { id, label: finalLabel, file: safeName, format };
            if (existing >= 0) manifest[existing] = entry;
            else manifest.push(entry);
            writeManifest(manifest);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, id, file: safeName, label: finalLabel, format }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });

      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/delete-model\/([^/?]+)/);
        if (!match || req.method !== 'DELETE') return next();

        const id = decodeURIComponent(match[1]);
        const manifest = readManifest();
        const entry = manifest.find(m => m.id === id);

        if (!entry) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Model not found' }));
          return;
        }

        const filePath = path.join(modelsDir, entry.file);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        const updated = manifest.filter(m => m.id !== id);
        writeManifest(updated);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, deleted: id }));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), modelApiPlugin()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../core'),
    },
    dedupe: ['three']
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
})
