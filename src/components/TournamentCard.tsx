"use client";

import Link from "next/link";

interface TournamentCardProps {
  id: string;
  name: string;
  game: string;
  status: string;
  teamCount: number;
  matchCount: number;
  createdAt: string;
}

function getGameBadge(game: string) {
  if (game === "FREE_FIRE") {
    return <span className="badge badge-freefire">🔥 Free Fire</span>;
  }
  return <span className="badge badge-bgmi">🎯 BGMI</span>;
}

function getStatusBadge(status: string) {
  const map: Record<string, { className: string; label: string }> = {
    SETUP: { className: "badge-status badge-setup", label: "Setup" },
    IN_PROGRESS: { className: "badge-status badge-in-progress", label: "🔴 Live" },
    COMPLETED: { className: "badge-status badge-completed", label: "✅ Completed" },
  };
  const config = map[status] || map.SETUP;
  return <span className={config.className}>{config.label}</span>;
}

export default function TournamentCard({
  id,
  name,
  game,
  status,
  teamCount,
  matchCount,
}: TournamentCardProps) {
  return (
    <Link href={`/tournament/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ cursor: "pointer" }}>
        {/* Card Header with gradient */}
        <div className="card-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            {getGameBadge(game)}
            {getStatusBadge(status)}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h3>
        </div>

        {/* Card Body */}
        <div style={{ padding: "16px 24px 20px" }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span style={{ fontWeight: 600 }}>{teamCount} Teams</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span style={{ fontWeight: 600 }}>{matchCount} Matches</span>
            </div>
          </div>

          {/* View button hint */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 4,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--navy-500)",
            }}
          >
            View Scorecard
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
