# Red Thread · Der rote Faden

The design bible and sketchbook for the Red Thread game project, built as a small
self-contained local app in the style of the Atrium tools: dark, no auth,
Tailscale-only.

> **Why this lives here.** This was built in a Claude Code cloud session that had
> no access to the Atrium repo on the Mac Studio, so it could not be written
> directly against Atrium's app framework or registered as a tile there. It is
> instead a zero-dependency Node service (Node 18+, no `npm install` needed) that
> implements the full spec and is meant to be moved into the Atrium repo — either
> run as-is on its own port, or ported into Atrium's app pattern using this as
> the reference implementation.

## One-command install on the Mac Studio

```sh
curl -fsSL https://raw.githubusercontent.com/Maximilianum96/maxtask/claude/red-thread-atrium-app-y8a3p9/red-thread/install-mac.sh | sh
```

Clones this branch to `~/RedThread`, sets up a launchd service (auto-start,
keep-alive), and health-checks it. Re-run the same command any time to update;
your data is never touched. Then open `http://100.79.103.60:7788/red-thread`.

## Run manually

```sh
node server.js            # listens on 0.0.0.0:7788
PORT=7788 RED_THREAD_DATA=/path/to/data node server.js
```

On first start it creates the data directory and seeds
`data/red-thread-bible.md` from `seed/red-thread-bible.md` (the v0.2 bible,
verbatim). The seed is only used when the bible file does not exist yet — it
never overwrites live data.

## Routes

| Route | Behavior |
| --- | --- |
| `GET /red-thread` | Rendered bible, "Last saved" timestamp, Edit button, sketchbook grid below |
| `GET /red-thread/edit` | Full-width monospace textarea with the raw markdown, Save and Cancel |
| `GET /red-thread/raw` | Raw markdown, `text/plain`, no HTML wrapper |
| `POST /red-thread/save` | Accepts form field `content` (urlencoded or multipart) **or** a raw text body; snapshots the current file to `versions/red-thread-bible-YYYYMMDD-HHMMSS.md` **before** writing, then returns `{"ok":true,"savedAt":...}` |
| `POST /red-thread/sketchbook/upload` | Multipart: `photo` (image), `rt` (e.g. RT-001, required), `caption` (optional) |
| `GET /red-thread/sketchbook/img/<file>` | Serves an uploaded sketch |
| `GET /red-thread/health` | `{"ok":true}` — for the tile status dot |

Every save snapshots first, so no version of the bible is ever lost.
Sketch uploads are stored in `data/sketchbook/` with a small `index.json`
(RT number, caption, filename, timestamp); the grid shows newest first.

## Data layout

```
data/
  red-thread-bible.md            the single source of truth
  versions/
    red-thread-bible-YYYYMMDD-HHMMSS.md
  sketchbook/
    index.json
    <timestamp>-<RT>-<id>.jpg|png|heic|webp
```

`data/` is gitignored — it is personal content, backed up separately like the
other Atrium app data directories.

## Registering the tile in Atrium

Add a tile to Atrium's launcher config following the same pattern as the other
apps (Schreiben, Notizen, Einklang):

- **Section:** MAR
- **Name:** Red Thread
- **Subtitle:** Der rote Faden · Spiel-Bibel
- **Emoji:** 🧵
- **URL:** `http://100.79.103.60:7788/red-thread` (or whatever port you run it on)
- **Status dot:** green when the service responds — point the health check at
  `GET /red-thread/health` (any 2xx from `/red-thread` also works)

If Atrium proxies apps under its own port instead of linking to per-app ports,
mount this server behind the proxy at the `/red-thread` prefix — all internal
links are prefix-absolute (`/red-thread/...`), so it works unchanged.

## Launch on the Mac Studio

However Atrium's other apps are kept alive (launchd, pm2, a supervisor script),
add this one the same way. A minimal launchd example:

```xml
<key>ProgramArguments</key>
<array>
  <string>/usr/local/bin/node</string>
  <string>/path/to/atrium/red-thread/server.js</string>
</array>
<key>KeepAlive</key><true/>
```
