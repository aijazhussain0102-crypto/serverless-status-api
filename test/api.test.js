import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import worker from '../src/index.js';

const migration = readFileSync(
  new URL('../migrations/0001_create_services.sql', import.meta.url),
  'utf8',
);

function databaseBinding(t, { migrated = true } = {}) {
  const database = new DatabaseSync(':memory:');
  t.after(() => database.close());
  if (migrated) {
    database.exec(migration);
  }

  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      return {
        async first() {
          return statement.get();
        },
        async all() {
          return { results: statement.all() };
        },
      };
    },
  };
}

function call(path, DB, method = 'GET') {
  return worker.fetch(
    new Request(new URL(path, 'https://status.example'), { method }),
    { DB },
  );
}

test('health verifies the database schema and reports the seeded row count', async (t) => {
  const response = await call('/health', databaseBinding(t));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'ok', service_count: 3 });
});

test('the status list returns the three fictional services', async (t) => {
  const response = await call('/api/services', databaseBinding(t));
  assert.equal(response.status, 200);

  const { services } = await response.json();
  assert.deepEqual(services.map(({ id, status }) => [id, status]), [
    ['dashboard', 'operational'],
    ['payments', 'degraded'],
    ['support', 'operational'],
  ]);
  assert.ok(services.every(({ updated_at }) => !Number.isNaN(Date.parse(updated_at))));
});

test('a missing database schema returns a safe 503 and emits a diagnostic log', async (t) => {
  const logs = t.mock.method(console, 'error', () => {});
  const response = await call('/health', databaseBinding(t, { migrated: false }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'database_unavailable' });
  assert.equal(logs.mock.callCount(), 1);
  const [line] = logs.mock.calls[0].arguments;
  assert.equal(JSON.parse(line).event, 'database_query_failed');
});

test('unmatched routes and write attempts return 404 and 405', async () => {
  assert.equal((await call('/unknown', undefined)).status, 404);
  const response = await call('/api/services', undefined, 'POST');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
});
