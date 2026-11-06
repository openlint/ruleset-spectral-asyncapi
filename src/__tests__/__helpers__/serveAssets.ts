import { afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { URL } from 'node:url';
import nock from 'nock';

type Body = string | Record<string, unknown>;

const createdFiles = new Set<string>();

afterEach(() => {
  nock.cleanAll();
  for (const file of createdFiles) {
    fs.rmSync(file, { force: true });
  }
  createdFiles.clear();
});

export function serveAssets(mocks: Record<string, Body>): void {
  for (const [uri, body] of Object.entries(mocks)) {
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      fs.mkdirSync(path.dirname(uri), { recursive: true });
      fs.writeFileSync(uri, typeof body === 'string' ? body : JSON.stringify(body));
      createdFiles.add(uri);
      continue;
    }

    const url = new URL(uri);
    const query = Object.fromEntries(url.searchParams);
    const request = nock(url.origin).persist().get(url.pathname);
    (Object.keys(query).length > 0 ? request.query(query) : request).reply(200, body);
  }
}
