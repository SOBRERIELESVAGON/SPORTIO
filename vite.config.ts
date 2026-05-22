import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const sharedDataDirectory = path.resolve(process.cwd(), '.sportia-data');
const sharedAthletesPath = path.join(sharedDataDirectory, 'athletes.json');
const sharedSurveysPath = path.join(sharedDataDirectory, 'surveys.json');
const sharedCommunicationsPath = path.join(sharedDataDirectory, 'communications.json');

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

function configureSharedJsonEndpoint(
  server: ViteDevServer,
  requestPath: string,
  filePath: string,
  entityName: string,
) {
  server.middlewares.use(requestPath, async (request, response) => {
      fs.mkdirSync(sharedDataDirectory, { recursive: true });

      if (request.method === 'GET') {
        if (!fs.existsSync(filePath)) {
          sendJson(response, 200, []);
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        fs.createReadStream(filePath).pipe(response);
        return;
      }

      if (request.method === 'PUT') {
        try {
          const body = await readRequestBody(request);
          const parsedBody = JSON.parse(body);

          if (!Array.isArray(parsedBody)) {
            sendJson(response, 400, { error: `Expected an array of ${entityName}.` });
            return;
          }

          fs.writeFileSync(filePath, JSON.stringify(parsedBody, null, 2));
          sendJson(response, 200, { ok: true, count: parsedBody.length });
        } catch {
          sendJson(response, 400, { error: `Invalid ${entityName} payload.` });
        }
        return;
      }

      response.statusCode = 405;
      response.setHeader('Allow', 'GET, PUT');
      response.end();
  });
}

function sharedDemoDataPlugin(): Plugin {
  return {
    name: 'sportia-shared-demo-data',
    configureServer(server) {
      configureSharedJsonEndpoint(server, '/api/athletes', sharedAthletesPath, 'athletes');
      configureSharedJsonEndpoint(server, '/api/surveys', sharedSurveysPath, 'surveys');
      configureSharedJsonEndpoint(
        server,
        '/api/communications',
        sharedCommunicationsPath,
        'communications',
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), sharedDemoDataPlugin()],
  server: {
    allowedHosts: true,
  },
});
