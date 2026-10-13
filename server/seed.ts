import "dotenv/config";
import mongoose from "mongoose";
import { Sprint, Task } from "./models";

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  await mongoose.connect(mongoUri);

  if ((await Sprint.countDocuments()) > 0 || (await Task.countDocuments()) > 0) {
    console.log("The database already has project data. No sample data was added.");
    return;
  }

  const [sprintOne, sprintTwo] = await Sprint.create([
    {
      name: "LHG Sprint 1",
      goal: "Set up the project and agree on the first delivery.",
      status: "Active",
      startDate: new Date(),
    },
    {
      name: "LHG Sprint 2",
      goal: "Build and refine the next set of project features.",
      status: "Planned",
    },
  ]);

  await Task.create([
    {
      title: "Set up the LHG project workspace",
      description: "Create the initial structure for the team.",
      status: "Done",
      priority: "High",
      assignee: "Jahir",
      sprintId: sprintOne._id,
    },
    {
      title: "Agree on the sprint backlog",
      description: "Review and prioritize the first sprint tasks.",
      status: "In Progress",
      priority: "Medium",
      assignee: "Dipak",
      sprintId: sprintOne._id,
    },
    {
      title: "Prepare the next sprint plan",
      description: "Collect upcoming work and confirm ownership.",
      status: "To Do",
      priority: "Low",
      assignee: "Sandeep",
      sprintId: sprintTwo._id,
    },
  ]);

  console.log("Added sample LHG sprints and tasks.");
}

seedDatabase()
  .catch((error: unknown) => {
    console.error("Could not add sample data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
