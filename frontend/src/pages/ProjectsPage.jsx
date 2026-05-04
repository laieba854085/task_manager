import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/projects", { token });
      setProjects(data.projects || []);
    } catch (err) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleCreateProject(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiRequest("/projects", {
        method: "POST",
        token,
        body: { name, description }
      });
      setName("");
      setDescription("");
      await fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Projects</h2>
      <p className="muted">Project status is auto-computed from tasks: Not Started, On Track, At Risk, Completed.</p>
      <form className="card form stack-gap" onSubmit={handleCreateProject}>
        <h3>Create Project</h3>
        <label htmlFor="projectName">Project Name</label>
        <input
          id="projectName"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <label htmlFor="projectDescription">Description</label>
        <input
          id="projectDescription"
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Project"}
        </button>
      </form>

      <div className="list-wrap">
        <h3>Your Projects</h3>
        {loading && <p>Loading projects...</p>}
        {!loading && projects.length === 0 && <p className="muted">No projects yet.</p>}
        {!loading &&
          projects.map((project) => (
            <article key={project._id} className="card">
              <div className="split-row">
                <h4>{project.name}</h4>
                <span
                  className={`badge ${
                    project.projectStatus === "COMPLETED"
                      ? "badge-success"
                      : project.projectStatus === "AT_RISK"
                        ? "badge-danger"
                        : project.projectStatus === "ON_TRACK"
                          ? "badge-warning"
                          : ""
                  }`}
                >
                  {project.projectStatus || "NOT_STARTED"}
                </span>
              </div>
              <p className="muted">{project.description || "No description"}</p>
              <p className="muted">
                Tasks: {project.taskStats?.completed || 0}/{project.taskStats?.total || 0} completed
                {project.taskStats?.overdue ? ` - ${project.taskStats.overdue} overdue` : ""}
              </p>
              <Link to={`/projects/${project._id}`}>Open Project</Link>
            </article>
          ))}
      </div>
    </section>
  );
}

