import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import {
  SPRINT_STATUSES,
  Sprint,
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TEAM_MEMBERS,
} from "./models";

const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<const Values extends readonly string[]>(
  values: Values,
  value: unknown,
): value is Values[number] {
  return typeof value === "string" && values.some((option) => option === value);
}

function isOptionalDate(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "string" && !Number.isNaN(Date.parse(value)))
  );
}

app.use(cors({ origin: frontendUrl }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/team", (_request, response) => {
  response.json(TEAM_MEMBERS);
});

app.get("/api/tasks", async (_request, response) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  response.json(tasks);
});

app.post("/api/tasks", async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ message: "Send task details as a JSON object." });
    return;
  }
  const body = request.body;
  const { title, description, status, priority, assignee, sprintId } = body;

  if (typeof title !== "string" || !title.trim()) {
    response.status(400).json({ message: "A task title is required." });
    return;
  }
  if (description !== undefined && typeof description !== "string") {
    response.status(400).json({ message: "Task description must be text." });
    return;
  }
  if (!isOneOf(TEAM_MEMBERS, assignee)) {
    response.status(400).json({ message: "Choose a team member for this task." });
    return;
  }
  if (status !== undefined && !isOneOf(TASK_STATUSES, status)) {
    response.status(400).json({ message: "Choose a valid task status." });
    return;
  }
  if (priority !== undefined && !isOneOf(TASK_PRIORITIES, priority)) {
    response.status(400).json({ message: "Choose a valid task priority." });
    return;
  }
  if (sprintId !== undefined && sprintId !== null && sprintId !== "" && typeof sprintId !== "string") {
    response.status(400).json({ message: "Sprint ID must be text." });
    return;
  }
  if (typeof sprintId === "string" && sprintId) {
    if (!mongoose.isValidObjectId(sprintId) || !(await Sprint.exists({ _id: sprintId }))) {
      response.status(400).json({ message: "Choose a sprint that exists." });
      return;
    }
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    assignee,
    sprintId: typeof sprintId === "string" && sprintId ? sprintId : null,
  });
  response.status(201).json(task);
});

app.get("/api/tasks/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: "That task ID is not valid." });
    return;
  }

  const task = await Task.findById(request.params.id);
  if (!task) {
    response.status(404).json({ message: "Task not found." });
    return;
  }
  response.json(task);
});

app.put("/api/tasks/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: "That task ID is not valid." });
    return;
  }

  if (!isRecord(request.body)) {
    response.status(400).json({ message: "Send task details as a JSON object." });
    return;
  }
  const body = request.body;
  const { title, description, status, priority, assignee, sprintId } = body;
  if (typeof title !== "string" || !title.trim()) {
    response.status(400).json({ message: "A task title is required." });
    return;
  }
  if (description !== undefined && typeof description !== "string") {
    response.status(400).json({ message: "Task description must be text." });
    return;
  }
  if (!isOneOf(TEAM_MEMBERS, assignee)) {
    response.status(400).json({ message: "Choose a team member for this task." });
    return;
  }
  if (!isOneOf(TASK_STATUSES, status)) {
    response.status(400).json({ message: "Choose a valid task status." });
    return;
  }
  if (!isOneOf(TASK_PRIORITIES, priority)) {
    response.status(400).json({ message: "Choose a valid task priority." });
    return;
  }
  if (sprintId !== undefined && sprintId !== null && sprintId !== "" && typeof sprintId !== "string") {
    response.status(400).json({ message: "Sprint ID must be text." });
    return;
  }
  if (typeof sprintId === "string" && sprintId) {
    if (!mongoose.isValidObjectId(sprintId) || !(await Sprint.exists({ _id: sprintId }))) {
      response.status(400).json({ message: "Choose a sprint that exists." });
      return;
    }
  }

  const task = await Task.findByIdAndUpdate(
    request.params.id,
    {
      title,
      description,
      status,
      priority,
      assignee,
      sprintId: typeof sprintId === "string" && sprintId ? sprintId : null,
    },
    { new: true, runValidators: true },
  );
  if (!task) {
    response.status(404).json({ message: "Task not found." });
    return;
  }
  response.json(task);
});

app.delete("/api/tasks/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: "That task ID is not valid." });
    return;
  }

  const task = await Task.findByIdAndDelete(request.params.id);
  if (!task) {
    response.status(404).json({ message: "Task not found." });
    return;
  }
  response.json({ message: "Task deleted." });
});

app.get("/api/sprints", async (_request, response) => {
  const sprints = await Sprint.find().sort({ createdAt: -1 });
  response.json(sprints);
});

app.post("/api/sprints", async (request, response) => {
  if (!isRecord(request.body)) {
    response.status(400).json({ message: "Send sprint details as a JSON object." });
    return;
  }
  const body = request.body;
  const { name, goal, status, startDate, endDate } = body;

  if (typeof name !== "string" || !name.trim()) {
    response.status(400).json({ message: "A sprint name is required." });
    return;
  }
  if (goal !== undefined && typeof goal !== "string") {
    response.status(400).json({ message: "Sprint goal must be text." });
    return;
  }
  if (status !== undefined && !isOneOf(SPRINT_STATUSES, status)) {
    response.status(400).json({ message: "Choose a valid sprint status." });
    return;
  }
  if (!isOptionalDate(startDate) || !isOptionalDate(endDate)) {
    response.status(400).json({ message: "Enter valid sprint dates." });
    return;
  }
  if (typeof startDate === "string" && startDate && typeof endDate === "string" && endDate && Date.parse(startDate) > Date.parse(endDate)) {
    response.status(400).json({ message: "The sprint end date must be after its start date." });
    return;
  }

  const sprint = await Sprint.create({
    name,
    goal,
    status,
    startDate: startDate || null,
    endDate: endDate || null,
  });
  response.status(201).json(sprint);
});

app.put("/api/sprints/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: "That sprint ID is not valid." });
    return;
  }

  if (!isRecord(request.body)) {
    response.status(400).json({ message: "Send sprint details as a JSON object." });
    return;
  }
  const body = request.body;
  const { name, goal, status, startDate, endDate } = body;
  if (typeof name !== "string" || !name.trim()) {
    response.status(400).json({ message: "A sprint name is required." });
    return;
  }
  if (goal !== undefined && typeof goal !== "string") {
    response.status(400).json({ message: "Sprint goal must be text." });
    return;
  }
  if (!isOneOf(SPRINT_STATUSES, status)) {
    response.status(400).json({ message: "Choose a valid sprint status." });
    return;
  }
  if (!isOptionalDate(startDate) || !isOptionalDate(endDate)) {
    response.status(400).json({ message: "Enter valid sprint dates." });
    return;
  }
  if (typeof startDate === "string" && startDate && typeof endDate === "string" && endDate && Date.parse(startDate) > Date.parse(endDate)) {
    response.status(400).json({ message: "The sprint end date must be after its start date." });
    return;
  }

  const sprint = await Sprint.findByIdAndUpdate(
    request.params.id,
    { name, goal, status, startDate: startDate || null, endDate: endDate || null },
    { new: true, runValidators: true },
  );
  if (!sprint) {
    response.status(404).json({ message: "Sprint not found." });
    return;
  }
  response.json(sprint);
});

app.delete("/api/sprints/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    response.status(400).json({ message: "That sprint ID is not valid." });
    return;
  }

  const sprint = await Sprint.findByIdAndDelete(request.params.id);
  if (!sprint) {
    response.status(404).json({ message: "Sprint not found." });
    return;
  }
  await Task.updateMany({ sprintId: sprint._id }, { $set: { sprintId: null } });
  response.json({ message: "Sprint deleted." });
});

app.use((_request, response) => {
  response.status(404).json({ message: "API route not found." });
});

const handleError: ErrorRequestHandler = (error, _request, response, next) => {
  console.error(error);
  if (response.headersSent) {
    next(error);
    return;
  }
  response.status(500).json({ message: "Something went wrong on the server." });
};
app.use(handleError);

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`LHG API is running at http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Could not start the LHG API:", error);
  process.exitCode = 1;
});
