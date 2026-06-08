# PerSQL on Render — starter

A minimal Node web service backed by an isolated [PerSQL](https://persql.com)
SQLite database. Each page load writes a row and reads the count — that
round trip is the whole integration.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/persql/render-starter)

## Deploy

1. **Get a database.** Visit **[render.persql.com/connect](https://render.persql.com/connect)**,
   sign in, and provision a database. You'll get three values:

   | Var | What |
   |---|---|
   | `PERSQL_API_URL` | `https://api.persql.com` |
   | `PERSQL_DATABASE` | `<namespace>/<db-slug>` |
   | `PERSQL_TOKEN` | a token scoped to that one database |

2. **Click Deploy to Render** above. The Blueprint (`render.yaml`) declares
   the three vars as prompted (`sync: false`) — paste the values from step 1
   when Render asks. To share them across services, put them in an
   [Environment Group](https://render.com/docs/configure-environment-variables) instead.

3. **Open the service URL.** You should see the visit counter increment on
   each refresh.

## How it connects

```js
import { PerSQL } from "@persql/sdk";

const db = new PerSQL({
  token: process.env.PERSQL_TOKEN,
  baseURL: process.env.PERSQL_API_URL, // defaults to https://api.persql.com
}).database(process.env.PERSQL_DATABASE); // "namespace/db-slug"

await db.query("SELECT count(*) AS n FROM visits");
```

See [`server.js`](./server.js) for the full example and
[docs.persql.com/integrations/render](https://docs.persql.com/integrations/render)
for the integration guide, including per-PR preview databases.

## Billing

PerSQL is usage-metered against a prepaid balance — no per-database fee.
A schema-only database that you don't query costs effectively nothing;
you pay for the requests, rows, and storage you actually use.
