# Serverless Status API

Personal cloud portfolio project by Aijaz Hussain.

I deployed a serverless API on Cloudflare Workers that reads three fictional service records from a managed D1 database. I applied the SQL migration, verified the public endpoints, and practised recovering from a failed release using a Worker version rollback.

**[Live health check](https://serverless-status-api.aijaz-labs.workers.dev/health)** · **[Live service list](https://serverless-status-api.aijaz-labs.workers.dev/api/services)** · **[Rollback incident report](docs/Cloudflare_Worker_Rollback_Incident_Report.md)**

## Architecture

| Component | Role |
|---|---|
| Cloudflare Worker | Serves the HTTPS API and queries D1 through the `DB` binding |
| Cloudflare D1 | Stores the three sample services and their statuses |
| SQL migration | Creates the `services` table and seeds the sample records |
| Node.js tests | Check healthy responses, database failures, and route handling |

## API endpoints

| Endpoint | Result |
|---|---|
| `GET /health` | Checks database access and returns the service count |
| `GET /api/services` | Lists the sample services and their current statuses |

## Verified rollback exercise

| Stage | Observed result |
|---|---|
| Baseline | Both live endpoints returned HTTP 200 |
| Simulated failure | A query against a nonexistent table triggered HTTP 503 on `/health`. The local regression test identified the missing table. |
| Recovery | Wrangler routed 100% of traffic back to the known-good Worker version. Both live endpoints returned HTTP 200 again, and all three records were present. |

The [incident report](docs/Cloudflare_Worker_Rollback_Incident_Report.md) documents the cause, rollback, and recovery checks.

## Run locally on Windows

With Node.js 24 LTS installed, open PowerShell in the project folder:

```powershell
npm.cmd ci
npm.cmd test
npx.cmd wrangler d1 migrations apply DB --local
npm.cmd run dev
```

Open `http://127.0.0.1:8787/health` in your browser. A healthy response is `{"status":"ok","service_count":3}`.