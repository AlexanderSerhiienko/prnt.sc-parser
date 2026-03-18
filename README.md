# Prnt.sc Parser

Full-stack app that searches random `prnt.sc` ids, validates screenshot pages through Puppeteer, and renders the results in a Vite-powered Vue gallery.

## Current Behavior

The backend is tuned to be conservative with the target site:

- sequential parsing only
- random delay between attempts
- automatic cooldown after repeated `403` / access denied

This makes the parser slower, but much less aggressive.

## Tech

- Express
- Puppeteer
- Vue 3
- Vuex 4
- Vite

## Environment

Server variables live in [.env.example](/Users/alexserhiienko/Documents/GitHub/prnt.sc-parser/.env.example).

Client variables live in [client/.env.example](/Users/alexserhiienko/Documents/GitHub/prnt.sc-parser/client/.env.example).

Important defaults:

- Server runs on `http://localhost:3001`
- Vite client runs on `http://localhost:5173`
- Client API base defaults to `http://localhost:3001`
- Safe batch max defaults to `100`
- ID length can be chosen from `5` to `9`, default is `6`

## Install

```bash
npm install
npm run install:client
```

## Run in Development

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run dev:client
```

## Production Build

```bash
npm run build:client
npm run start:prod
```

In production the Express server serves the built Vite client from `client/dist`.

## API

`GET /rimg/stream?count=3&length=6`

- Primary frontend endpoint
- Emits `start`, `item`, `progress`, `done`, and `run-error` events

`GET /rimg/batch?count=3&length=6`

- Success: `{ "items": [{ "id": "abc123", "url": "..." }], "requested": 3, "returned": 2, "attempted": 7, "failed": 5 }`
- Full failure: `{ "code": "PARSE_RETRY_LIMIT_EXCEEDED", "message": "...", "requested": 3, "returned": 0, "failed": 12 }`
- Cooldown: `{ "code": "ACCESS_DENIED_COOLDOWN", "message": "..." }`

`failed` represents failed attempts, not just missing requested items.

`GET /rimg`

- Compatibility endpoint that returns a single `{ "id": "abc123", "url": "..." }`

`GET /img/:id`

- Returns a cached proxied image when the parser decides proxying is needed
- Returns `404` if the image is missing or expired
