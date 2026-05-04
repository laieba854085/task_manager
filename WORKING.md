# Project Working Guide

## 1. What This Project Is
Team Task Manager is a full-stack MERN-style app for managing team work with role-based access.

- Frontend: React + Vite (JavaScript)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT

Primary goal:
- Create projects
- Add team members
- Create and assign tasks
- Track progress through dashboard metrics

---

## 2. Core Roles
There are two role layers:

1. Global user role (`User.role`)
- `ADMIN` or `MEMBER` on account profile

2. Project role (`Project.members[].role`)
- `ADMIN` or `MEMBER` inside a specific project

Important:
- Project permissions are enforced mainly by **project role**
- A user can be admin in one project and member in another

---

## 3. Main Functional Flow
Expected usage flow:

1. User signs up / logs in
2. Admin creates a project
3. Admin adds members to project by email
4. Admin creates tasks for that project
5. Admin assigns tasks to project members
6. Assignee (or project admin) updates task status
7. Dashboard and project status reflect task changes

---

## 4. How Status Works
### Task status
- `TODO`
- `IN_PROGRESS`
- `DONE`

### Project status (computed from tasks)
- `NOT_STARTED`: no tasks
- `ON_TRACK`: has tasks, no overdue, not fully complete
- `AT_RISK`: has overdue unfinished tasks
- `COMPLETED`: all tasks done

### Overdue rules
A task is overdue when:
- due date is in the past
- status is not `DONE`

---

## 5. Dashboard Metrics Logic
Dashboard values are derived from tasks/projects:

- Total Projects
- Active Projects (projects having at least one task)
- Total Tasks
- In Progress
- Completed
- Overdue
- Completion Rate
- Due in 48 Hours

Refresh behavior:
- Dashboard fetches data automatically and supports manual refresh

---

## 6. Backend API Surface
### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users
- `GET /api/users/by-email?email=<email>`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `POST /api/projects/:projectId/members`

### Tasks
- `GET /api/tasks`
- `GET /api/tasks?projectId=<projectId>`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId/status`
- `PATCH /api/tasks/:taskId/assign`

---

## 7. Frontend Page Responsibilities
- `LoginPage` / `SignupPage`: authentication
- `DashboardPage`: analytics + summary cards
- `ProjectsPage`: create/list projects + status visibility
- `ProjectDetailsPage`: member management
- `TasksPage`: select project, create/assign/update tasks

---

## 8. Access Control Summary
- Create project: authenticated user
- Add member: project admin
- Create task: project admin
- Assign task: project admin
- Update status: assignee or project admin
- View project/tasks: must be project member

---

## 9. Styling System
Current visual direction:
- Blue-first background
- Lime accents
- Bold headings
- Rounded white cards with shadow
- Floating/frosted navbar

See `style.md` for canonical style rules.

---

## 10. Common Confusions (Quick Answers)
1. "Project created but dashboard not changing?"
- Project count changes immediately.
- Task metrics change only after tasks are created/updated.

2. "User not found while adding member?"
- Email must exist in app users (signed up).
- Matching is trimmed and case-insensitive.

3. "Who sets project status?"
- Nobody manually. It is computed from task data.

---

## 11. Environment Variables
Backend requires:
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

Frontend (deploy):
- `VITE_API_BASE_URL`

---

## 12. LLM Context Hint
If feeding to an LLM, mention:
- "This app uses project-scoped RBAC"
- "Project status is computed, not manually set"
- "Task state drives dashboard analytics"
- "Use backend routes in section 6 for integration tasks"

