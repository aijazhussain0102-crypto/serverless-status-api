# Serverless Status API

**Personal cloud portfolio project by Aijaz Hussain**

A small service status API for a fictional business. Cloudflare Workers serves HTTPS requests and reads three fictional services from Cloudflare D1, a managed SQL database. You will build and deploy the environment, apply a database migration, run smoke tests, and practise recovering a broken release.

## Cost and prerequisites

Use a Cloudflare account on **Workers Free**, D1 within its included limits, and the account's `workers.dev` address. Cloudflare offers Workers Free without a credit card. When this plan's D1 daily quotas are exhausted, queries fail until the quota resets. The commands below use free-plan resources and local development tools. Select **Free** during setup and leave paid upgrades and domain purchases off.

Use Node.js **24 LTS** with npm. The examples use Windows PowerShell and `curl.exe`.

[Workers pricing](https://www.cloudflare.com/plans/developer-platform/) · [Cloudflare Workers signup](https://www.cloudflare.com/products/workers/) · [D1 quota behaviour](https://developers.cloudflare.com/d1/reference/faq/#pricing)

## 1. Run locally first

Open PowerShell in the extracted `serverless-status-api` folder. Run:

```powershell
npm ci
npm test
npx wrangler d1 migrations apply DB --local
npm run dev
```

The first test command runs the real migration and API queries against an in-memory SQLite database. Wrangler then creates a separate local D1 database and starts your Worker. Keep the dev terminal open. In a second PowerShell window, check both endpoints:

```powershell
curl.exe -i http://127.0.0.1:8787/health
curl.exe -i http://127.0.0.1:8787/api/services
```

Expect **200** from both. The health response should show `"status":"ok"` and `"service_count":3`. The status list should show Customer Dashboard, Payments API, and Support Portal.

**Your first change** · Open another PowerShell window in the project folder and use the command below to mark the fictional Payments API operational in local D1. Fetch the service list again to verify the data changed.

```powershell
npx wrangler d1 execute DB --local --command "UPDATE services SET status = 'operational', updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = 'payments';"
curl.exe -i http://127.0.0.1:8787/api/services
```

[Local D1 development](https://developers.cloudflare.com/d1/best-practices/local-development/)

## 2. Provision and deploy on Cloudflare Free

1. Create your Cloudflare account, confirm that Workers is on **Free**, and register the account's `workers.dev` subdomain in Workers & Pages if prompted. This will be a public demo with fictional data.
2. In the project folder, sign in and create the remote database:

   ```powershell
   npx wrangler login
   npx wrangler d1 create portfolio-status-db
   ```

3. Copy the generated database ID into `wrangler.jsonc` in place of the placeholder. Verify the config has one D1 binding named `DB` with the database name `portfolio-status-db`. If Wrangler already edited the config, verify the same fields and retain the existing `migrations_dir`.
4. Apply the migration to the remote database and deploy:

   ```powershell
   npx wrangler d1 migrations apply DB --remote
   npx wrangler deploy
   ```

5. Save the deployed Worker URL and version ID printed by Wrangler. Replace the example URL below. Verify both endpoints return **200** from the public Worker. The Payments API will initially show `degraded` in the remote database because its migration creates the original sample rows. Your local update lives in local D1.

   ```powershell
   $base = 'https://serverless-status-api.your-subdomain.workers.dev'
   curl.exe -i "$base/health"
   curl.exe -i "$base/api/services"
   ```

[Create and bind a D1 database](https://developers.cloudflare.com/d1/get-started/) · [D1 migration commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/#d1-migrations-apply) · [Workers public subdomain](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## 3. Diagnose and roll back a bad release

Run the drill after confirming both cloud endpoints work. Keep the database and its schema intact during the drill.

1. Record the working deployment version ID. Open a second terminal in the project folder, run `npx wrangler tail --format pretty`, and leave it open to watch the Worker's live logs.
2. In `src/index.js`, change the table name in **healthQuery** from `services` to `services_missing`. Run `npm test` and note which check detects the regression. For this drill, deploy that deliberate failure to your demo Worker with `npx wrangler deploy`.
3. Request `/health` again. Confirm the **503** response and find `database_query_failed` in the live logs. Request `/api/services` and confirm that the service list still works. Record why the health check failed.
4. Roll back to the working version. Replace the example ID with the one from step 1:

   ```powershell
   $goodVersion = 'paste-the-known-good-version-id-here'
   npx wrangler rollback $goodVersion
   ```

5. Repeat the two HTTPS checks. Confirm both return **200**. Restore `services` in your local `healthQuery` and rerun `npm test`. Record the before and after results and the recovery time you observed. Close the log tail with **Ctrl+C**.

[Real-time Worker logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/) · [Worker version rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## Evidence for GitHub

| Milestone | What to capture | Result |
|---|---|---|
| Local validation | Passing tests and successful local endpoint responses | Pending |
| Cloud deployment | D1 migration result, Worker URL, and first healthy response | Pending |
| Incident diagnosis | First failing test, HTTP 503, and matching log entry | Pending |
| Recovery | Rollback output, restored HTTP 200 responses, and elapsed time | Pending |

Publish the project with your own results. Write a short incident note with the impact, what you saw in the logs, the root cause, the rollback version, and the verification steps. Keep login credentials and account tokens out of the repository.

## Résumé bullet after completion

> Deployed a serverless status API on Cloudflare Workers with a managed D1 database, applied SQL migrations, and used live logs and a version rollback to diagnose and recover from a simulated deployment failure.

[Rollback incident report](docs/Cloudflare_Worker_Rollback_Incident_Report.md)
