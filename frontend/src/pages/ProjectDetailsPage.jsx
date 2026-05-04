import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { token, user } = useAuth();
  const [project, setProject] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const myRole = useMemo(() => {
    if (!project || !user) {
      return null;
    }
    const member = project.members?.find((item) => {
      const id = typeof item.userId === "string" ? item.userId : item.userId?._id;
      return id === user.id;
    });
    return member?.role || null;
  }, [project, user]);

  const canManageMembers = myRole === "ADMIN";

  async function fetchProject() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/projects/${projectId}`, { token });
      setProject(data.project);
    } catch (err) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function handleAddMember(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const lookup = await apiRequest(`/users/by-email?email=${encodeURIComponent(normalizedEmail)}`, {
        token
      });
      await apiRequest(`/projects/${projectId}/members`, {
        method: "POST",
        token,
        body: { userId: lookup.user.id, role }
      });
      setEmail("");
      setRole("MEMBER");
      await fetchProject();
    } catch (err) {
      setError(err.message || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (!project) {
    return <p className="error-text">{error || "Project not found"}</p>;
  }

  return (
    <section>
      <h2>{project.name}</h2>
      <p className="muted">{project.description || "No description"}</p>
      <p className="muted">Your project role: {myRole || "N/A"}</p>
      {error && <p className="error-text">{error}</p>}

      <div className="list-wrap">
        <h3>Members</h3>
        {(project.members || []).map((member, index) => {
          const profile = typeof member.userId === "string" ? null : member.userId;
          const idLabel = typeof member.userId === "string" ? member.userId : member.userId?._id;
          return (
            <article className="card" key={`${idLabel}-${index}`}>
              <p>
                <strong>{profile?.name || "User"}</strong> ({member.role})
              </p>
              <p className="muted">{profile?.email || idLabel}</p>
            </article>
          );
        })}
      </div>

      {canManageMembers && (
        <form className="card form stack-gap" onSubmit={handleAddMember}>
          <h3>Add Member</h3>
          <label htmlFor="memberEmail">Member Email</label>
          <input
            id="memberEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="memberRole">Project Role</label>
          <select id="memberRole" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Member"}
          </button>
        </form>
      )}
    </section>
  );
}
