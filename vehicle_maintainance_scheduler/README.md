# Vehicle Maintenance Scheduler

REST service that selects the optimal subset of maintenance tasks per depot using a 0/1 Knapsack algorithm.

## Run

```bash
cp .env.example .env   # fill ACCESS_TOKEN
npm install
node src/server.js
```

## Endpoints

- `GET /api/depots`
- `GET /api/vehicles`
- `GET /api/schedule` — optimal schedule for every depot
- `GET /api/schedule/:depotId` — optimal schedule for a single depot
