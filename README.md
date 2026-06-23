# TaskMind

> Built for **Vibe2Ship 2026** Hackathon by Coding Ninjas × Google for Developers

## Problem Statement
The Last-Minute Life Saver — helping students and professionals stop missing deadlines through intelligent AI assistance.

## Solution Overview
TaskMind is an AI productivity companion that goes beyond passive reminders. It autonomously analyzes your tasks, prioritizes them by urgency and importance, builds smart daily schedules, breaks down complex tasks into steps, and even drafts deadline-extension emails — all powered by Google Gemini AI.

## Key Features
- **AI Day Analysis** — Gemini analyzes all your tasks and tells you exactly what to focus on right now
- **AI Schedule Generator** — builds a personalized, hour-by-hour daily plan around your pending tasks, breaks, and buffer time
- **AI Email Draft** — generates polite, professional emails for deadline extensions, progress updates, help requests, or rescheduling
- **Smart Task Prioritization** — automatic scoring based on deadline urgency + priority level
- **Task Breakdown** — AI breaks any task into 3-5 clear, actionable steps
- **Overdue Detection** — visual alerts for missed deadlines with instant action options

## Technologies Used
- **React 18** — frontend UI
- **Google Gemini API** — AI core (auto-detects available model for your key)
- **Google AI Studio** — development and deployment platform
- **Recharts** — analytics visualizations
- **CSS3** — custom styling, no external UI library

## Google Technologies Utilized
- Gemini API (`generativelanguage.googleapis.com`)
- Google AI Studio for deployment

## Setup & Run

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000)

Add your Gemini API key in **Settings** to activate all AI features.
Get a free key at: https://aistudio.google.com/apikey

## Deployment (Google AI Studio)
1. Open Google AI Studio → Build tab
2. Import this project
3. Click Publish → Get Started → Publish App
4. Copy the published app URL for submission

## Developer
**Pernapati Tarun Eswar**
BTech CSE, NIT Warangal
Roll No: 22CSB0B19