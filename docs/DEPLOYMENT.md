# Deployment

## Local Docker

```bash
docker compose up -d --build
```

Services:

- `backend`: Node/Express API on port `3000`
- `postgres`: PostgreSQL available inside the Compose network

The backend startup command runs:

```bash
npx prisma db push
npm run seed
node dist/server.js
```

## Local Development

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

For local development without Docker, provide a reachable PostgreSQL
`DATABASE_URL`.

## Coolify

Use Docker Compose deployment with the repository root as the compose context
and `docker-compose.coolify.yml` as the compose file.

Required environment values:

- `SERVICE_PASSWORD_POSTGRES`
- `SERVICE_PASSWORD_API_KEY`

Map domains to the `backend` service on container port `3000`.

Keep Postgres storage persistent through Coolify volume configuration.

## Smoke Check

```bash
curl http://localhost:3000/health
curl -H "X-API-Key: dev-companycore-key" http://localhost:3000/projects
```
