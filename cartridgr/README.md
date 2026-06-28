# Cartridgr

Deine plattformübergreifende Spielebibliothek mit KI-Empfehlungen.

## Setup

### 1. GitHub

Repository auf GitHub erstellen und diesen Code pushen.

### 2. Netlify

1. Netlify mit dem GitHub-Repo verbinden
2. Build settings: Publish directory = `public`, Functions directory = `netlify/functions`
3. Environment Variables unter **Site configuration → Environment variables** eintragen:

| Variable | Wert |
|---|---|
| `IGDB_CLIENT_ID` | Deine Twitch/IGDB Client ID |
| `IGDB_CLIENT_SECRET` | Dein Twitch/IGDB Client Secret |

### 3. Deploy

Nach dem Eintragen der Env Vars → **Trigger deploy** in Netlify.

## Features

- Steam-Bibliothek importieren (HTML-Export von account/licenses)
- Manuelle Eingabe für GOG, Xbox, Nintendo, Epic etc.
- Cover-Art via IGDB
- Spielzeiten via HowLongToBeat
- KI-Empfehlungen via Claude (Anthropic)
- Status-Tracking (Nicht gespielt / Spiele gerade / Abgeschlossen / Abgebrochen)
- Raster- und Listenansicht
- Lokale Datenspeicherung (localStorage)
- Dark Mode Support
