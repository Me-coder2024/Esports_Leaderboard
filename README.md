# Esports Tournament Scoreboard & Leaderboard (Free Fire & BGMI)

A full-stack esports tournament scoring and live leaderboard web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

Co-branded for **Parul University** & **Lakshya 2047 — Center for Future Skills**.

---

## 🚀 Features

- **🎮 Dual Game Support:** Supports official tournament scoring systems for **Free Fire** and **BGMI**.
- **⚡ Auto Point Derivation:** Scorers only input **Placement (Rank)** and **Total Kills**; all positional and elimination points are calculated automatically.
- **📊 Real-time Standings & Leaderboard:** BGMI Masters Series style leaderboard with top-3 rank badges, win counters (Booyah/WWCD), finishes breakdown, and live 30s auto-refresh.
- **🛡️ Scorer Admin Dashboard (`/score`):**
  1. Select Game (Free Fire / BGMI)
  2. Create Tournament
  3. Quick Add Teams (with optional player/leader names & inline editing)
  4. Configure Number of Matches
  5. Pre-Match Review & Team Roster Edit
  6. Match-by-Match Scoring with numeric keypad-friendly inputs & duplicate rank validation
  7. Tournament deletion and switching support
- **🌐 Public Read-Only Scorecard (`/tournament/[id]`):** Instant sharing link for spectators and players.

---

## 🏆 Scoring Rules

### 1. Free Fire (Official 12-Point System)
- **Elimination Points:** 1 point per kill
- **Positional Points:**
  - 1st Place (Booyah!): **12 pts**
  - 2nd Place: **9 pts**
  - 3rd Place: **8 pts**
  - 4th Place: **7 pts**
  - 5th Place: **6 pts**
  - 6th Place: **5 pts**
  - 7th Place: **4 pts**
  - 8th Place: **3 pts**
  - 9th Place: **2 pts**
  - 10th Place: **1 pt**
  - 11th – 12th+ Place: **0 pts**

### 2. BGMI (Official Krafton 10-Point System — BGIS / BMPS / BGMS)
- **Elimination Points:** 1 point per kill
- **Positional Points:**
  - 1st Place (WWCD): **10 pts**
  - 2nd Place: **6 pts**
  - 3rd Place: **5 pts**
  - 4th Place: **4 pts**
  - 5th Place: **3 pts**
  - 6th Place: **2 pts**
  - 7th Place: **1 pt**
  - 8th Place: **1 pt**
  - 9th – 16th+ Place: **0 pts**

---

## 🛠️ Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Me-coder2024/Esports_Leaderboard.git
cd Esports_Leaderboard
npm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```env
ADMIN_PASSCODE=tournament2024
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
```

### 3. Database Setup (Supabase)
Run the SQL script found in `supabase/setup.sql` in your Supabase SQL Editor.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔐 Admin Access
- Scorer Dashboard: [http://localhost:3000/score](http://localhost:3000/score)
- Default Admin Passcode: `tournament2024`
