# Agent Operating Guide

## Project
- Name: Team Task Manager (Full Stack)
- Goal: Build a web app to manage projects, tasks, and team progress with role-based access (Admin/Member).

## Core Features
- Authentication: signup and login
- Project and team management
- Task create/assign/update status
- Dashboard: task counts, status, overdue tracking

## Architecture Rules
- Frontend: React (Vite, JavaScript)
- Backend: Node.js + Express (JavaScript)
- Database: MongoDB (Mongoose)
- API style: REST

## Role Model
- `ADMIN`: create projects, manage members, assign tasks, full read/write access
- `MEMBER`: view assigned projects/tasks, update assigned task status

## Engineering Standards
- Validate all request payloads
- Use centralized error handling
- Keep controllers thin, move logic to services
- Keep UI consistent by following `style.md`
- Update `plan.md` whenever a step starts/completes

## Delivery Requirements
- Deploy on Railway
- Submit: live URL, GitHub repo, README, 2-5 min demo video
