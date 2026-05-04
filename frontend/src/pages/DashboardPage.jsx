import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { token, user } = useAuth();
  const [cards, setCards] = useState([
    { label: "Total Projects", value: 0 },
    { label: "Active Projects", value: 0 },
    { label: "Total Tasks", value: 0 },
    { label: "In Progress", value: 0 },
    { label: "Completed", value: 0 },
    { label: "Overdue", value: 0 }
  ]);
  const [health, setHealth] = useState({ completionRate: 0, dueSoon: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projectStats, setProjectStats] = useState([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const today = useMemo(() => new Date(), []);

  async function load(refreshFlag = false) {
    if (refreshFlag) {
      setRefreshing(true);
    }
    const now = new Date();
    setError("");
    try {
      const [taskData, projectData] = await Promise.all([
        apiRequest("/tasks", { token }),
        apiRequest("/projects", { token })
      ]);

      const tasks = taskData.tasks || [];
      const projects = projectData.projects || [];
      const projectMap = new Map(projects.map((project) => [project._id, project.name]));
      const activeProjectIds = new Set(tasks.map((task) => task.projectId));

      const total = tasks.length;
      const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
      const completed = tasks.filter((task) => task.status === "DONE").length;
      const overdue = tasks.filter(
        (task) => task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < now
      ).length;
      const dueSoon = tasks.filter((task) => {
        if (!task.dueDate || task.status === "DONE") return false;
        const diffDays = (new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 2;
      }).length;

      const byProject = new Map();
      tasks.forEach((task) => {
        const current = byProject.get(task.projectId) || { total: 0, done: 0 };
        current.total += 1;
        if (task.status === "DONE") current.done += 1;
        byProject.set(task.projectId, current);
      });

      const topProjects = Array.from(byProject.entries())
        .map(([projectId, counts]) => ({
          projectId,
          projectName: projectMap.get(projectId) || "Unknown Project",
          total: counts.total,
          done: counts.done,
          completionRate: counts.total ? Math.round((counts.done / counts.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);

      const recent = [...tasks]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

      setCards([
        { label: "Total Projects", value: projects.length },
        { label: "Active Projects", value: activeProjectIds.size },
        { label: "Total Tasks", value: total },
        { label: "In Progress", value: inProgress },
        { label: "Completed", value: completed },
        { label: "Overdue", value: overdue }
      ]);
      setHealth({
        completionRate: total ? Math.round((completed / total) * 100) : 0,
        dueSoon
      });
      setProjectStats(topProjects);
      setRecentTasks(recent);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const intervalId = setInterval(() => {
      load();
    }, 8000);

    return () => clearInterval(intervalId);
  }, [token, today]);

  return (
    <section className="dashboard-wrap">
      <div className="hero-strip card">
        <p className="eyebrow">Team Workspace</p>
        <h2>Welcome back, {user?.name}</h2>
        <p className="muted">Role: {user?.role}. Track your team momentum and unblock work quickly.</p>
        <button className="ghost-btn refresh-btn" type="button" onClick={() => load(true)} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh Metrics"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="grid">
        {cards.map((card) => (
          <article key={card.label} className="card metric-card">
            <p className="muted">{card.label}</p>
            <p className="kpi">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid analytics-grid">
        <article className="card metric-card">
          <p className="muted">Completion Rate</p>
          <p className="kpi">{health.completionRate}%</p>
        </article>
        <article className="card metric-card">
          <p className="muted">Due in 48 Hours</p>
          <p className="kpi">{health.dueSoon}</p>
        </article>
      </div>

      <div className="grid two-cols">
        <div className="card">
          <div className="split-row">
            <h3>Project Progress</h3>
            <span className="muted">Top active projects</span>
          </div>
          <div className="list-wrap compact-list">
            {projectStats.length === 0 && <p className="muted">No project stats yet.</p>}
            {projectStats.map((row) => (
              <article key={row.projectId} className="progress-row">
                <div className="split-row">
                  <strong>{row.projectName}</strong>
                  <span className="muted">{row.completionRate}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${row.completionRate}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="split-row">
            <h3>Recent Tasks</h3>
            <span className="muted">Latest activity</span>
          </div>
          <div className="list-wrap compact-list">
            {recentTasks.length === 0 && <p className="muted">No tasks yet.</p>}
            {recentTasks.map((task) => (
              <article key={task._id} className="task-row">
                <strong>{task.title}</strong>
                <span className={`badge ${task.status === "DONE" ? "badge-success" : task.status === "IN_PROGRESS" ? "badge-warning" : ""}`}>
                  {task.status}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
