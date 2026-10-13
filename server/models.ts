import mongoose, { Schema } from "mongoose";

export const TASK_STATUSES = ["To Do", "In Progress","On Hold","Blocked","In Review","QA","Go Live","Backlog","Temp Hold", "Done"] as const;
export const TASK_PRIORITIES = ["Low", "Medium", "High"] as const;
export const TEAM_MEMBERS = ["Jahir", "Dipak", "Sandeep"] as const;
export const SPRINT_STATUSES = ["Planned", "Active", "Completed"] as const;

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "Backlog" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Low" },
    assignee: { type: String, enum: TEAM_MEMBERS, required: true },
    sprintId: { type: Schema.Types.ObjectId, ref: "Sprint", default: null },
  },
  { timestamps: true },
);

const sprintSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String, trim: true, default: "" },
    status: { type: String, enum: SPRINT_STATUSES, default: "Planned" },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task =
  mongoose.models.Task ?? mongoose.model("Task", taskSchema);
export const Sprint =
  mongoose.models.Sprint ?? mongoose.model("Sprint", sprintSchema);
