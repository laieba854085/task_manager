import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

export function TasksPage() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", dueDate: "" });

  const myRoleInProject = useMemo(() => {
    if (!selectedProject || !user) return null;
    const member = selectedProject.members?.find((m) => {
      const id = typeof m.userId === "string" ? m.userId : m.userId?._id;
      return id === user.id;
    });
    return member?.role || null;
  }, [selectedProject, user]);

  const canManage = myRoleInProject === "ADMIN";

  async function loadProjects() {
    const data = await apiRequest("/projects", { token });
    setProjects(data.projects || []);
  }

  async function loadTasks(projectId) {
    if (!projectId) {
      setTasks([]);
      return;
    }
    const data = await apiRequest(`/tasks?projectId=${projectId}`, { token });
    setTasks(data.tasks || []);
  }

  async function handleSelectProject(projectId) {
    setSelectedProjectId(projectId);
    setError("");
    if (!projectId) {
      setSelectedProject(null);
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const detail = await apiRequest(`/projects/${projectId}`, { token });
      setSelectedProject(detail.project);
      await loadTasks(projectId);
    } catch (err) {
      setError(err.message || "Failed to load project tasks");
      setSelectedProject(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects().catch(() => setError("Failed to load projects"));
  }, []);

  async function createTask(event) {
    event.preventDefault();
    if (!selectedProjectId) return;
    setCreating(true);
    setError("");
    try {
      await apiRequest("/tasks", {
        method: "POST",
        token,
        body: {
          title: form.title,
          projectId: selectedProjectId,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined
        }
      });
      setForm({ title: "", dueDate: "" });
      await loadTasks(selectedProjectId);
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(taskId, status) {
    try {
      await apiRequest(`/tasks/${taskId}/status`, {
        method: "PATCH",
        token,
        body: { status }
      });
      await loadTasks(selectedProjectId);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  }

  async function assign(taskId, assigneeId) {
    try {
      await apiRequest(`/tasks/${taskId}/assign`, {
        method: "PATCH",
        token,
        body: { assigneeId }
      });
      await loadTasks(selectedProjectId);
    } catch (err) {
      setError(err.message || "Failed to assign task");
    }
  }

  return (
    <section>
      <h2>Tasks</h2>
      <p className="muted">Simple flow: choose project -> create task (admin) -> update status.</p>
      {error && <p className="error-text">{error}</p>}

      <div className="card stack-gap">
        <label htmlFor="projectFilter">Project</label>
        <select
          id="projectFilter"
          value={selectedProjectId}
          onChange={(event) => handleSelectProject(event.target.value)}
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {canManage && selectedProjectId && (
        <form className="card form stack-gap" onSubmit={createTask}>
          <h3>Create Task</h3>
          <label htmlFor="taskTitle">Title</label>
          <input
            id="taskTitle"
            type="text"
            value={form.title}
            onChange={(event) => setForm((s) => ({ ...s, title: event.target.value }))}
            required
          />
          <label htmlFor="taskDue">Due Date</label>
          <input
            id="taskDue"
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((s) => ({ ...s, dueDate: event.target.value }))}
          />
          <button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Task"}
          </button>
        </form>
      )}

      {!selectedProjectId && <p className="muted">Select a project to view tasks.</p>}
      {loading && <p>Loading...</p>}

      {selectedProjectId && !loading && (
        <div className="list-wrap">
          {tasks.length === 0 && <p className="muted">No tasks yet.</p>}
          {tasks.map((task) => (
            <article key={task._id} className="card stack-gap">
              <div className="split-row">
                <strong>{task.title}</strong>
                <span className={`badge ${task.status === "DONE" ? "badge-success" : ""}`}>
                  {task.status}
                </span>
              </div>

              <div className="inline-actions">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="ghost-btn"
                    onClick={() => setStatus(task._id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {canManage && selectedProject?.members?.length > 0 && (
                <div className="inline-actions">
                  {selectedProject.members.map((member, idx) => {
                    const id = typeof member.userId === "string" ? member.userId : member.userId?._id;
                    const name = typeof member.userId === "string" ? member.userId : member.userId?.name;
                    return (
                      <button
                        key={`${task._id}-${id}-${idx}`}
                        type="button"
                        className="ghost-btn"
                        onClick={() => assign(task._id, id)}
                      >
                        Assign {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

