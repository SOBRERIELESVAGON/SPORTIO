import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';

const sharedDataDirectory = path.resolve(process.cwd(), '.sportia-data');
const sharedAthletesPath = path.join(sharedDataDirectory, 'athletes.json');

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';

    request.on('data', (chunk: Buffer) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function sharedAthletesPlugin(): Plugin {
  return {
    name: 'sportia-shared-athletes',
    configureServer(server) {
      server.middlewares.use('/api/athletes', async (request, response) => {
        fs.mkdirSync(sharedDataDirectory, { recursive: true });

        if (request.method === 'GET') {
          if (!fs.existsSync(sharedAthletesPath)) {
            sendJson(response, 200, []);
            return;
          }

          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          fs.createReadStream(sharedAthletesPath).pipe(response);
          return;
        }

        if (request.method === 'PUT') {
          try {
            const body = await readRequestBody(request);
            const parsedBody = JSON.parse(body);

            if (!Array.isArray(parsedBody)) {
              sendJson(response, 400, { error: 'Expected an array of athletes.' });
              return;
            }

            fs.writeFileSync(sharedAthletesPath, JSON.stringify(parsedBody, null, 2));
            sendJson(response, 200, { ok: true, count: parsedBody.length });
          } catch {
            sendJson(response, 400, { error: 'Invalid athletes payload.' });
          }
          return;
        }

        response.statusCode = 405;
        response.setHeader('Allow', 'GET, PUT');
        response.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sharedAthletesPlugin()],
  server: {
    allowedHosts: true,
  },
});
