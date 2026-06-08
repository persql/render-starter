import { createServer } from "node:http";
import { PerSQL } from "@persql/sdk";

// PerSQL connection — the three vars come from https://render.persql.com/connect
// and are set in your Render service's Environment (or an Env Group).
const { PERSQL_TOKEN, PERSQL_DATABASE, PERSQL_API_URL } = process.env;

const configured = Boolean(PERSQL_TOKEN && PERSQL_DATABASE);
const db = configured
  ? new PerSQL({ token: PERSQL_TOKEN, baseURL: PERSQL_API_URL }).database(PERSQL_DATABASE)
  : null;

// Run-once schema setup. Render starts one instance on the free plan;
// IF NOT EXISTS keeps this idempotent across restarts.
let ready = configured
  ? db
      .query(
        "CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, at TEXT NOT NULL DEFAULT (datetime('now')))",
      )
      .then(() => true)
  : Promise.resolve(false);

const server = createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (!configured) {
    res.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    res.end(
      page(
        "Not connected yet",
        "Set <code>PERSQL_TOKEN</code> and <code>PERSQL_DATABASE</code> (and optionally <code>PERSQL_API_URL</code>) on this Render service. Get them at <a href=\"https://render.persql.com/connect\">render.persql.com/connect</a>.",
      ),
    );
    return;
  }

  try {
    await ready;
    await db.query("INSERT INTO visits DEFAULT VALUES");
    const result = await db.query("SELECT count(*) AS n FROM visits");
    const n = result.data[0]?.n ?? 0;
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      page(
        `${n} visit${n === 1 ? "" : "s"}`,
        `This page is backed by an isolated PerSQL SQLite database (<code>${escapeHtml(
          PERSQL_DATABASE,
        )}</code>). Every load writes one row and reads the count — that round trip is the whole integration.`,
      ),
    );
  } catch (err) {
    res.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    res.end(page("Query failed", escapeHtml(String(err?.message ?? err))));
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`listening on :${port}`));

function page(title, body) {
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PerSQL on Render</title>
<body style="font:15px/1.6 ui-sans-serif,system-ui;max-width:640px;margin:64px auto;padding:0 24px">
<h1 style="font-size:28px;margin:0 0 8px">${title}</h1>
<p style="color:#525252">${body}</p>
<p style="color:#a3a3a3;font-size:13px">PerSQL render starter &middot; <a href="https://persql.com">persql.com</a></p>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
