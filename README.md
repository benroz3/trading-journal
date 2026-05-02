# Trading Journal

Local trading journal app for futures & commodities. Track trades, upload chart screenshots, and analyze performance.

## Firebase setup

Create a Firebase project and enable **Firestore** and **Storage**. Generate a **service account** JSON key (Project settings → Service accounts).

Copy `.env.example` to `.env` and set:

- `FIREBASE_STORAGE_BUCKET` — usually `your-project-id.appspot.com`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — entire JSON on **one line**, **or**
- `GOOGLE_APPLICATION_CREDENTIALS` — path to the JSON file if you mount it into the backend container

## Run

```bash
docker compose up -d --build
```

Open **http://localhost:3000**

## Stop

```bash
docker compose down
```

Data lives in your Firebase project (not local Docker volumes).

## Ports

| Service  | Port |
|----------|------|
| Frontend | 3000 |
| Backend  | 4000 |
