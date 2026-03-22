# Alfred: Your Intelligent Personal Assistant

Alfred is a sophisticated, AI-powered personal assistant designed to help users stay productive, healthy, and focused. By integrating seamlessly with daily workflows, Alfred provides personalized task management, growth insights, and real-time support.

## Project Overview

Alfred was built to solve the "productivity paradox"—where users have many tools but lack a cohesive, intelligent system to manage their daily goals and wellbeing. Alfred acts as a central hub, synthesizing user data to provide actionable advice.

- **Youtube Pitch Deck:** https://youtu.be/FNDDRpzQvYw 
- **Devpost Submission:** https://devpost.com/software/meet-alfred?ref_content=my-projects-tab&ref_feature=my_projects


## Key Features

### 1. AI-Powered Assistant (Alfred)
- **Context-Aware Chat:** Alfred understands your role, focus areas, and current state to provide relevant, professional, and warm support.
- **Proactive Insights:** Alfred analyzes your daily progress to offer personalized growth tips.
- **Resilient Connectivity:** Implemented with exponential backoff and retry logic to ensure reliable communication with the Gemini API, even under high load.

### 2. Intelligent Task Management
- **Smart Suggestions:** Alfred generates specific, actionable tasks based on your focus, priorities, and current mood.
- **Completion Tracking:** Easily manage and track your daily tasks to maintain momentum.

### 3. Daily Wellbeing Metrics
- **Holistic Tracking:** Monitor essential metrics like steps, sleep, and mood to maintain a healthy balance.
- **Growth Visualization:** Track your progress over time with streaks and completion statistics.

### 4. Personalized Onboarding
- **User Profiling:** Tailored setup process to understand user roles, priorities, and focus areas, ensuring Alfred is effective from day one.

## Design Philosophy & Rationale

- **Clarity & Focus:** The UI is designed to reduce cognitive load, prioritizing essential information and actions.
- **Proactive Support:** Instead of just being a passive tool, Alfred is designed to be proactive, offering support when stress is detected or when tasks need organizing.
- **Resilience:** We prioritized robust error handling and API communication to ensure the assistant is always available when needed.

## Technical Overview

- **Frontend:** React 18+ with TypeScript.
- **Styling:** Tailwind CSS for a modern, responsive interface.
- **AI Integration:** Powered by Google's Gemini models via the `@google/genai` SDK.
- **State Management:** React hooks (`useState`, `useEffect`) for managing application state and API interactions.
- **Animations:** `motion/react` for smooth transitions between screens.

## Getting Started

1. **Clone the repository.**
2. **Install dependencies:** `npm install`
3. **Configure Environment:** Ensure `GEMINI_API_KEY` is set in your environment.
4. **Run the development server:** `npm run dev`

## Credit

Created for "FoundersHack 2026" by Team Chicken Tiki Taka (Kanav, Rohhan, Anhad, Hariesh). Copyright 2026.
