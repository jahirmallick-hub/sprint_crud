"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://lhg-project-api.onrender.com"
    : "http://localhost:4000");
const STATUSES = ["To Do", "In Progress", "Done"] as const;
const PRIORITIES = ["Low", "Medium", "High"] as const;
const TEAM = ["Jahir", "Dipak", "Sandeep"] as const;
const SPRINT_STATUSES = ["Planned", "Active", "Completed"] as const;

type TaskStatus = (typeof STATUSES)[number];
type Priority = (typeof PRIORITIES)[number];
type SprintStatus = (typeof SPRINT_STATUSES)[number];

type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: (typeof TEAM)[number];
  sprintId: string | null;
};

type Sprint = {
  _id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
};

type TaskForm = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: (typeof TEAM)[number];
  sprintId: string;
};

type SprintForm = {
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
};

const emptyTask: TaskForm = {
  title: "",
  description: "",
  status: "To Do",
  priority: "Medium",
  assignee: "Jahir",
  sprintId: "",
};

const emptySprint: SprintForm = {
  name: "",
  goal: "",
  status: "Planned",
  startDate: "",
  endDate: "",
};

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "The request could not be completed.");
  }
  return data as T;
}

function displayDate(date: string | null) {
  if (!date) return "Date not set";
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState("all");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTask);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprintForm, setSprintForm] = useState<SprintForm>(emptySprint);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadData() {
    const [nextTasks, nextSprints] = await Promise.all([
      apiRequest<Task[]>("/api/tasks"),
      apiRequest<Sprint[]>("/api/sprints"),
    ]);
    setTasks(nextTasks);
    setSprints(nextSprints);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [nextTasks, nextSprints] = await Promise.all([
          apiRequest<Task[]>("/api/tasks"),
          apiRequest<Sprint[]>("/api/sprints"),
        ]);
        if (mounted) {
          setTasks(nextTasks);
          setSprints(nextSprints);
        }
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not connect to the API.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleTasks = useMemo(
    () =>
      activeSprint === "all"
        ? tasks
        : tasks.filter((task) => task.sprintId === activeSprint),
    [activeSprint, tasks],
  );

  function openNewTask() {
    setEditingTask(null);
    setTaskForm({ ...emptyTask, sprintId: activeSprint === "all" ? "" : activeSprint });
    setTaskFormOpen(true);
  }

  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      sprintId: task.sprintId ?? "",
    });
    setTaskFormOpen(true);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        editingTask ? `/api/tasks/${editingTask._id}` : "/api/tasks",
        {
          method: editingTask ? "PUT" : "POST",
          body: JSON.stringify(taskForm),
        },
      );
      await loadData();
      setTaskFormOpen(false);
      setNotice(editingTask ? "Task updated." : "Task added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save task.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/tasks/${task._id}`, { method: "DELETE" });
      await loadData();
      setNotice("Task deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete task.");
    }
  }

  async function saveSprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        editingSprint ? `/api/sprints/${editingSprint._id}` : "/api/sprints",
        {
          method: editingSprint ? "PUT" : "POST",
          body: JSON.stringify(sprintForm),
        },
      );
      await loadData();
      setEditingSprint(null);
      setSprintForm(emptySprint);
      setNotice(editingSprint ? "Sprint updated." : "Sprint added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save sprint.");
    } finally {
      setSaving(false);
    }
  }

  function editSprint(sprint: Sprint) {
    setEditingSprint(sprint);
    setSprintForm({
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate?.slice(0, 10) ?? "",
      endDate: sprint.endDate?.slice(0, 10) ?? "",
    });
  }

  async function deleteSprint(sprint: Sprint) {
    if (!window.confirm(`Delete "${sprint.name}"? Its tasks will stay in the backlog.`)) {
      return;
    }
    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/sprints/${sprint._id}`, { method: "DELETE" });
      await loadData();
      if (activeSprint === sprint._id) setActiveSprint("all");
      setNotice("Sprint deleted. Its tasks are now in the backlog.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete sprint.");
    }
  }

  const doneCount = tasks.filter((task) => task.status === "Done").length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="LHG home">
          <span className="brand-mark">L</span>
          <span>LHG workspace</span>
        </a>

        <div className="sidebar-label">PROJECT</div>
        <button className="project-link selected" type="button">
          <span className="project-icon">L</span>
          LHG Delivery
          <span className="online-dot" />
        </button>

        <div className="sidebar-label sprint-label">SPRINTS</div>
        <button
          className={`sprint-link ${activeSprint === "all" ? "active" : ""}`}
          onClick={() => setActiveSprint("all")}
          type="button"
        >
          <span className="sprint-link-dot">◦</span> All tasks
          <span className="sidebar-count">{tasks.length}</span>
        </button>
        {sprints.map((sprint) => (
          <button
            className={`sprint-link ${activeSprint === sprint._id ? "active" : ""}`}
            key={sprint._id}
            onClick={() => setActiveSprint(sprint._id)}
            type="button"
          >
            <span className={`sprint-link-dot ${sprint.status.toLowerCase()}`}>◦</span>
            <span className="sprint-link-name">{sprint.name}</span>
            <span className="sidebar-count">
              {tasks.filter((task) => task.sprintId === sprint._id).length}
            </span>
          </button>
        ))}

        <div className="sidebar-spacer" />
        <div className="team-card">
          <div className="team-card-heading">YOUR TEAM</div>
          <div className="team-members">
            {TEAM.map((member, index) => (
              <div className="team-member" key={member}>
                <span className={`avatar avatar-${index}`}>{member[0]}</span>
                <span>{member}</span>
                <span className="member-dot" />
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <span className="profile-avatar">A</span>
          <span>
            <strong>Workspace</strong>
            <small>LHG project</small>
          </span>
          <span className="footer-menu">•••</span>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Projects</span><span className="crumb-separator">/</span>
            <strong>LHG Delivery</strong><span className="crumb-separator">/</span>
            <span>{activeSprint === "all" ? "All tasks" : sprints.find((sprint) => sprint._id === activeSprint)?.name}</span>
          </div>
          <div className="topbar-right">
            <span className="updated-label"><span className="online-dot" /> Live project</span>
            <button className="topbar-add" onClick={openNewTask} type="button">
              <span>＋</span> Add task
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">PROJECT OVERVIEW <span>·</span> LHG</div>
              <h1>{activeSprint === "all" ? "Project board" : sprints.find((sprint) => sprint._id === activeSprint)?.name}</h1>
              <p className="page-subtitle">Plan the work. Keep the team moving.</p>
            </div>
            <button className="primary-button" onClick={openNewTask} type="button">
              <span>＋</span> Create task
            </button>
          </div>

          {error && (
            <div className="message error-message" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")} type="button" aria-label="Dismiss error">×</button>
            </div>
          )}
          {notice && (
            <div className="message success-message" role="status">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} type="button" aria-label="Dismiss message">×</button>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div><span className="stat-label">Total tasks</span><strong>{tasks.length}</strong></div>
              <span className="stat-footnote">in this project</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">◷</div>
              <div><span className="stat-label">In progress</span><strong>{tasks.filter((task) => task.status === "In Progress").length}</strong></div>
              <span className="stat-footnote">moving forward</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div><span className="stat-label">Completed</span><strong>{doneCount}</strong></div>
              <span className="stat-footnote">{tasks.length ? `${Math.round((doneCount / tasks.length) * 100)}% of tasks` : "ready to begin"}</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">▦</div>
              <div><span className="stat-label">Sprints</span><strong>{sprints.length}</strong></div>
              <span className="stat-footnote">planned together</span>
            </div>
          </div>

          <div className="board-toolbar">
            <div>
              <h2>Task board <span className="task-total">{visibleTasks.length}</span></h2>
              <p>Move work from idea to done.</p>
            </div>
            <div className="board-legend"><span><i className="legend-dot todo" /> To do</span><span><i className="legend-dot progress" /> In progress</span><span><i className="legend-dot done" /> Done</span></div>
          </div>

          {loading ? (
            <div className="empty-board">Loading your project...</div>
          ) : (
            <div className="board-grid">
              {STATUSES.map((status) => {
                const columnTasks = visibleTasks.filter((task) => task.status === status);
                return (
                  <section className="board-column" key={status}>
                    <div className="column-heading">
                      <div className="column-title">
                        <i className={`legend-dot ${status === "To Do" ? "todo" : status === "Done" ? "done" : "progress"}`} />
                        <h3>{status}</h3>
                        <span className="column-count">{columnTasks.length}</span>
                      </div>
                      <button className="icon-button" onClick={openNewTask} type="button" aria-label={`Add ${status} task`}>＋</button>
                    </div>
                    <div className="task-list">
                      {columnTasks.map((task) => (
                        <article className="task-card" key={task._id}>
                          <div className="task-card-top">
                            <span className="task-key">LHG-{task._id.slice(-6).toUpperCase()}</span>
                            <button className="icon-button task-menu" onClick={() => openEditTask(task)} type="button" aria-label={`Edit ${task.title}`}>•••</button>
                          </div>
                          <button className="task-title-button" onClick={() => openEditTask(task)} type="button">{task.title}</button>
                          {task.description && <p className="task-description">{task.description}</p>}
                          <div className="task-tags">
                            <span className={`priority-tag ${task.priority.toLowerCase()}`}><i />{task.priority}</span>
                            {task.sprintId && <span className="task-sprint-tag">{sprints.find((sprint) => sprint._id === task.sprintId)?.name ?? "Sprint"}</span>}
                          </div>
                          <div className="task-card-footer">
                            <span className={`avatar avatar-${TEAM.indexOf(task.assignee)}`}>{task.assignee[0]}</span>
                            <span className="assignee-name">{task.assignee}</span>
                            <button className="delete-task" onClick={() => void deleteTask(task)} type="button">Delete</button>
                          </div>
                        </article>
                      ))}
                      {columnTasks.length === 0 && <div className="column-empty">Nothing here yet</div>}
                    </div>
                    <button className="add-task-link" onClick={openNewTask} type="button"><span>＋</span> Add a task</button>
                  </section>
                );
              })}
            </div>
          )}

          <section className="sprint-section">
            <div className="sprint-section-heading">
              <div><h2>Sprint planning</h2><p>Keep the next milestones in sight.</p></div>
              <span className="sprint-total">{sprints.length} {sprints.length === 1 ? "sprint" : "sprints"}</span>
            </div>
            <div className="sprint-planning-grid">
              <form className="sprint-form" onSubmit={saveSprint}>
                <div className="form-heading">
                  <strong>{editingSprint ? "Edit sprint" : "Create a sprint"}</strong>
                  <span>{editingSprint ? "Update its details" : "Add a milestone for the team"}</span>
                </div>
                <label>Sprint name<input required value={sprintForm.name} onChange={(event) => setSprintForm({ ...sprintForm, name: event.target.value })} placeholder="e.g. LHG Sprint 3" /></label>
                <label>Sprint goal<input value={sprintForm.goal} onChange={(event) => setSprintForm({ ...sprintForm, goal: event.target.value })} placeholder="What will the team deliver?" /></label>
                <div className="date-row">
                  <label>Starts<input type="date" value={sprintForm.startDate} onChange={(event) => setSprintForm({ ...sprintForm, startDate: event.target.value })} /></label>
                  <label>Ends<input type="date" value={sprintForm.endDate} onChange={(event) => setSprintForm({ ...sprintForm, endDate: event.target.value })} /></label>
                </div>
                <label>Status<select value={sprintForm.status} onChange={(event) => setSprintForm({ ...sprintForm, status: event.target.value as SprintStatus })}>{SPRINT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                <div className="form-actions">
                  {editingSprint && <button className="secondary-button" onClick={() => { setEditingSprint(null); setSprintForm(emptySprint); }} type="button">Cancel</button>}
                  <button className="primary-button small" disabled={saving} type="submit">{saving ? "Saving..." : editingSprint ? "Save sprint" : "Add sprint"}</button>
                </div>
              </form>

              <div className="sprint-list">
                {sprints.length === 0 && <div className="sprint-empty">Your sprints will show up here after you add one.</div>}
                {sprints.map((sprint) => (
                  <article className="sprint-card" key={sprint._id}>
                    <div className="sprint-card-icon">▦</div>
                    <div className="sprint-card-content">
                      <div className="sprint-card-title-row">
                        <strong>{sprint.name}</strong>
                        <span className={`sprint-status ${sprint.status.toLowerCase()}`}>{sprint.status}</span>
                      </div>
                      <p>{sprint.goal || "No sprint goal yet."}</p>
                      <div className="sprint-dates">{displayDate(sprint.startDate)} <span>→</span> {displayDate(sprint.endDate)}</div>
                      <div className="sprint-progress">
                        <span>{tasks.filter((task) => task.sprintId === sprint._id && task.status === "Done").length} of {tasks.filter((task) => task.sprintId === sprint._id).length} tasks complete</span>
                        <div className="progress-track"><span style={{ width: `${tasks.filter((task) => task.sprintId === sprint._id).length ? (tasks.filter((task) => task.sprintId === sprint._id && task.status === "Done").length / tasks.filter((task) => task.sprintId === sprint._id).length) * 100 : 0}%` }} /></div>
                      </div>
                    </div>
                    <div className="sprint-card-actions">
                      <button onClick={() => editSprint(sprint)} type="button">Edit</button>
                      <button onClick={() => void deleteSprint(sprint)} type="button">Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {taskFormOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTaskFormOpen(false); }}>
          <form className="task-modal" onSubmit={saveTask}>
            <div className="modal-heading">
              <div><span className="eyebrow">LHG PROJECT</span><h2>{editingTask ? "Edit task" : "Create a task"}</h2></div>
              <button className="icon-button close-button" onClick={() => setTaskFormOpen(false)} type="button" aria-label="Close">×</button>
            </div>
            <label>Task title<input autoFocus required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="What needs to get done?" /></label>
            <label>Description<textarea rows={3} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="Add a few details..." /></label>
            <div className="modal-form-row">
              <label>Status<select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
              <label>Priority<select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Priority })}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
            </div>
            <div className="modal-form-row">
              <label>Assignee<select value={taskForm.assignee} onChange={(event) => setTaskForm({ ...taskForm, assignee: event.target.value as TaskForm["assignee"] })}>{TEAM.map((member) => <option key={member}>{member}</option>)}</select></label>
              <label>Sprint<select value={taskForm.sprintId} onChange={(event) => setTaskForm({ ...taskForm, sprintId: event.target.value })}><option value="">Backlog</option>{sprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name}</option>)}</select></label>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setTaskFormOpen(false)} type="button">Cancel</button>
              <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving..." : editingTask ? "Save changes" : "Create task"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
