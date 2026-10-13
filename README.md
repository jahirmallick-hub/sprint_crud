# LHG Project Board

A small task and sprint tracker for the LHG team, built with Next.js, TypeScript, Express, and MongoDB. The project keeps the web app and API in the same workspace, with the API running separately so each part stays easy to follow.

## Team

- Jahir
- Dipak
- Sandeep

## Run the project

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB

The API uses the MongoDB Atlas cluster configured by `MONGODB_URI` in `.env`.

### 3. Configure environment variables

Copy `.env.example` to `.env`, then replace `YOUR_DB_USERNAME` and `YOUR_URL_ENCODED_DB_PASSWORD` with the Atlas database user's credentials. URL-encode reserved characters in the password. Keep `.env` private; it is excluded from Git.

### 4. Start the API and web app

Open two terminals in this project folder:

```bash
npm run api
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Express API runs at [http://localhost:4000](http://localhost:4000).

### 5. Add optional sample data

With MongoDB running and `.env` configured, run:

```bash
npm run seed
```

The seed command adds two example sprints and three example tasks only when the database is empty. It is safe to run again.

## What you can do

- Create, view, update, and delete LHG tasks.
- Assign tasks to Jahir, Dipak, or Sandeep.
- Set a task status, priority, and sprint.
- Create, view, update, and delete sprints.
- Track sprint goals, dates, status, and task completion.
- See tasks left behind when a sprint is deleted: they return to the backlog.

## API routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | Check that the API is running |
| GET | `/api/team` | List the LHG team members |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Replace a task's editable fields |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/sprints` | List sprints |
| POST | `/api/sprints` | Create a sprint |
| PUT | `/api/sprints/:id` | Update a sprint |
| DELETE | `/api/sprints/:id` | Delete a sprint and return its tasks to the backlog |

Tasks have a title, description, status, priority, assignee, and optional sprint. The board shows a Jira-style key based on each task's MongoDB ID, for example `LHG-A1B2C3`.

## Useful scripts

- `npm run dev` — start the Next.js web app.
- `npm run api` — start the Express API in watch mode.
- `npm run api:start` — start the Express API without watch mode.
- `npm run seed` — add example sprints and tasks to an empty database.
- `npm run lint` — lint the project.
- `npm run build` — build the web app.

## Deploy for free

The app can be deployed with the Next.js frontend on Vercel, the Express API on
Render, and MongoDB Atlas for the database. Free-tier limits apply; Render may
put an idle API to sleep, so its first request after inactivity can take longer.

### 1. Prepare MongoDB Atlas

Create a free Atlas cluster and database user, then copy its connection string.
If Atlas requires a network access entry for Render, allow `0.0.0.0/0` and use a
strong, database-specific password. Never put the connection string in frontend
environment variables or commit it to Git.

### 2. Deploy the API on Render

Push the project to a GitHub repository and create a Render Blueprint from it.
Render will use [`render.yaml`](./render.yaml) to create the free API service.
Enter the Atlas connection string for `MONGODB_URI`. For the initial
`FRONTEND_URL` prompt, enter `http://localhost:3000`; replace it with the Vercel
site origin after the frontend is deployed.

Wait for the API health check to pass at
`https://<your-render-service>.onrender.com/api/health`.

### 3. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel, keep the project root as the
root directory, and add this environment variable before deploying:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com` |

After deployment, set the Render service's `FRONTEND_URL` to the Vercel site
origin (for example, `https://your-project.vercel.app`) so the API accepts
browser requests from the site.

### 4. Add optional sample data

Run the seed script once from a trusted local environment with `MONGODB_URI`
pointing to the production Atlas database:

```bash
npm run seed
```

The script only inserts sample sprints and tasks when both collections are
empty. Do not add `MONGODB_URI` to Vercel; it is only needed by the API and the
one-time seed command.
