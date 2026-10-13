# How the LHG Project Board Works

This guide explains the project in beginner-friendly terms: what each part does, how they communicate, and what happens when you use the board.

## The big picture

The app has three main parts:

```text
Your browser
    ↓
Next.js frontend — http://localhost:3000
    ↓ HTTP requests
Express API — http://localhost:4000
    ↓ Mongoose
MongoDB Atlas
```

- **Frontend:** displays the board and collects your input.
- **API:** receives frontend requests, checks the data, and decides what database operation to perform.
- **Database:** stores tasks and sprints so they remain available after the app restarts.
- **Mongoose:** helps the API define, validate, save, and retrieve MongoDB documents.

## What the important files do

- [`app/page.tsx`](./app/page.tsx) builds the board UI. It loads tasks and sprints from the API and sends requests when you add, edit, or delete items.
- [`app/layout.tsx`](./app/layout.tsx) provides the shared page structure, fonts, and browser title.
- [`server/index.ts`](./server/index.ts) defines the Express API routes and starts the API server.
- [`server/models.ts`](./server/models.ts) defines the shape of task and sprint records for Mongoose.
- [`server/seed.ts`](./server/seed.ts) contains an optional script for inserting example data into an empty database.
- [`package.json`](./package.json) defines the commands used to run the frontend, API, and seed script.
- [`.env.example`](./.env.example) is a template showing which environment settings are needed. Your private `.env` file holds the real settings and should not be committed.

## How data is described

A task can have a title, description, status, priority, assignee, and optional sprint. A sprint has a name, goal, status, and optional start and end dates. These fields and their rules are described in [`server/models.ts`](./server/models.ts).

MongoDB stores each task and sprint as a document in a collection. Mongoose models provide the API with a convenient way to create, find, update, and delete those documents.

## What happens when you use the board

When the board opens:

1. The frontend sends requests to the API to get the task and sprint lists.
2. The API asks MongoDB for those records through Mongoose.
3. The API returns the records to the frontend as JSON.
4. The frontend displays them on the page.

When you create a task:

1. You fill in the form and submit it.
2. The frontend sends the task details to the API as JSON.
3. The API checks that the details are valid, such as requiring a title and choosing an allowed assignee.
4. Mongoose saves the task in MongoDB Atlas.
5. The API returns the saved task.
6. The frontend reloads the task and sprint lists so the board shows the latest information.

Editing and deleting tasks or sprints follow a similar request-and-response flow. When a sprint is deleted, the API clears that sprint assignment from its tasks so the tasks remain in the backlog.

## Environment settings and MongoDB Atlas

The private `.env` file contains settings used by the local application:

- `MONGODB_URI` tells the API how to connect to MongoDB Atlas.
- `API_PORT` sets the API's local port (normally `4000`).
- `FRONTEND_URL` tells the API which frontend origin to allow.
- `NEXT_PUBLIC_API_URL` tells the frontend where to send API requests.

The API loads `.env` when it starts. It checks that `MONGODB_URI` exists, connects to MongoDB, and only then starts accepting API requests. If the connection fails, the API does not start successfully.

Keep your actual database username and password in `.env`, not in `.env.example`, source code, or documentation. The project `.gitignore` excludes `.env` from Git so it is not accidentally committed.

The connection string currently does not name a database explicitly. Mongoose uses the default database name `test` in that case, which may be the database you see in Atlas.

## Running the project

The frontend and API run as two separate processes. Open two terminals in the project folder.

In the first terminal, start the API:

```bash
npm run api
```

In the second terminal, start the Next.js frontend:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The API runs at [http://localhost:4000](http://localhost:4000).

Useful commands from [`package.json`](./package.json):

- `npm run dev` — start the frontend.
- `npm run api` — start the API in watch mode, which restarts it when server files change.
- `npm run api:start` — start the API without watch mode.
- `npm run seed` — add example sprints and tasks if the database does not already contain project data.
- `npm run lint` — check the project with ESLint.
- `npm run build` — build the frontend for production.

## API routes

The routes in [`server/index.ts`](./server/index.ts) provide the operations the frontend uses:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check that the API is running |
| `GET` | `/api/team` | Get the team member list |
| `GET` | `/api/tasks` | Get all tasks |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get one task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/sprints` | Get all sprints |
| `POST` | `/api/sprints` | Create a sprint |
| `PUT` | `/api/sprints/:id` | Update a sprint |
| `DELETE` | `/api/sprints/:id` | Delete a sprint and return its tasks to the backlog |

`GET` reads data, `POST` creates data, `PUT` updates data, and `DELETE` removes data. The `:id` part of a route is replaced with the MongoDB ID of the task or sprint.
