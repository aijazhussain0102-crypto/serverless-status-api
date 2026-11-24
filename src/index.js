const healthQuery = 'SELECT COUNT(*) AS service_count FROM services';
const servicesQuery = `
  SELECT id, name, status, updated_at
  FROM services
  ORDER BY name
  LIMIT 25
`;

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== '/health' && pathname !== '/api/services') {
      return json({ error: 'not_found' }, 404);
    }

    if (request.method !== 'GET') {
      return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' });
    }

    try {
      if (pathname === '/health') {
        const row = await env.DB.prepare(healthQuery).first();
        return json({ status: 'ok', service_count: row.service_count });
      }

      const { results } = await env.DB.prepare(servicesQuery).all();
      return json({ services: results });
    } catch (error) {
      console.error(JSON.stringify({
        event: 'database_query_failed',
        path: pathname,
        message: error instanceof Error ? error.message : String(error),
      }));
      return json({ error: 'database_unavailable' }, 503);
    }
  },
};
