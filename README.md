# Trading Journal

Local trading journal app for futures & commodities. Track trades, upload chart screenshots, and analyze performance.

## Run

```bash
docker compose up -d --build
```

Open **http://localhost:3000**

## Stop

```bash
docker compose down
```

Data persists between restarts (stored in Docker volumes).

To delete all data:

```bash
docker compose down -v
```

## Ports

| Service  | Port |
|----------|------|
| Frontend | 3000 |
| Backend  | 4000 |
| Postgres | 5432 |
