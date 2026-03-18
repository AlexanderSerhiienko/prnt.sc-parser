# Prnt.sc Parser

Full-stack app that searches random `prnt.sc` ids, validates screenshot pages through Puppeteer, and renders the results in a refreshed Vue 3 gallery.

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

`GET /rimg`

- Success: `{ "id": "abc123", "url": "..." }`
- Error: `{ "code": "PARSE_RETRY_LIMIT_EXCEEDED", "message": "..." }`

`GET /img/:id`

- Returns a cached proxied image when the parser decides proxying is needed
- Returns `404` if the image is missing or expired
