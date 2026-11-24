# Cloudflare Worker Rollback Incident Report

I deployed a serverless status API on Cloudflare Workers backed by D1.

During a simulated failure, I changed the health check to query a nonexistent
table. The local test identified the missing table, and the deployed health
endpoint returned HTTP 503.

I rolled back to the known-good Worker version. Wrangler confirmed that it
received 100% of traffic. Both endpoints then returned HTTP 200, and the
service list showed all three records.

**Verified recovery:** HTTP 200 → 503 → 200
