"use client";

import React, { useState } from "react";

export interface TeamStanding {
  team_id: string;
  team_name: string;
  team_leader_name: string;
  wwcd: number;
  matches_played: number;
  total_kills: number;
  total_placement_points: number;
  total_elimination_points: number;
  total_points: number;
  match_points: Record<number, number>;
  rank: number;
}

interface StandingsTableProps {
  standings: TeamStanding[];
  totalMatches: number;
  completedMatches: number;
  tournamentName?: string;
  subtitle?: string;
  showMatchBreakdown?: boolean;
}

function getRankBadge(rank: number) {
  if (rank === 1) return <span className="rank-badge rank-badge-1">1</span>;
  if (rank === 2) return <span className="rank-badge rank-badge-2">2</span>;
  if (rank === 3) return <span className="rank-badge rank-badge-3">3</span>;
  return <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>#{rank}</span>;
}

export default function StandingsTable({
  standings,
  totalMatches,
  completedMatches,
  tournamentName,
  subtitle,
  showMatchBreakdown = false,
}: StandingsTableProps) {
  // Default to 2-column split view if there are more than 6 teams
  const [layoutMode, setLayoutMode] = useState<"split" | "single">(() =>
    standings && standings.length > 6 ? "split" : "split"
  );

  if (!standings || standings.length === 0) {
    return (
      <div className="standings-wrapper" style={{ textAlign: "center", padding: "48px 32px" }}>
        <p style={{ color: "var(--navy-900)", opacity: 0.5, fontSize: "1rem", fontWeight: 600 }}>
          No standings data yet. Complete a match to see results.
        </p>
      </div>
    );
  }

  const matchNumbers = Array.from({ length: totalMatches }, (_, i) => i + 1);

  // Split teams into Left Half and Right Half
  const halfIndex = Math.ceil(standings.length / 2);
  const leftHalf = standings.slice(0, halfIndex);
  const rightHalf = standings.slice(halfIndex);

  const renderTableSection = (teams: TeamStanding[], isRightColumn = false) => (
    <div className="table-scroll-container" style={{ flex: 1, minWidth: 0 }}>
      <table className="standings-table" style={{ width: "100%", fontSize: "0.82rem" }}>
        <thead>
          <tr>
            <th style={{ width: 44, padding: "10px 6px" }}>#</th>
            <th style={{ textAlign: "left", paddingLeft: 12 }}>Team</th>
            <th style={{ width: 48, padding: "10px 6px" }} title="Wins (Booyah / WWCD)">WIN</th>
            <th style={{ width: 44, padding: "10px 4px" }} title="Matches Played">M</th>
            <th style={{ width: 48, padding: "10px 4px" }} title="Total Finishes (Kills)">PTS(K)</th>
            {showMatchBreakdown && layoutMode === "single" &&
              matchNumbers.map((n) => (
                <th key={n} style={{ width: 36, padding: "10px 4px" }}>M{n}</th>
              ))}
            <th style={{ width: 52, padding: "10px 4px" }} title="Placement Points">POS</th>
            <th style={{ width: 56, padding: "10px 6px" }} title="Total Points">TOT</th>
          </tr>
        </thead>
        <tbody className="stagger-children">
          {teams.map((team, idx) => (
            <tr key={team.team_id} style={{ animationDelay: `${(isRightColumn ? halfIndex + idx : idx) * 0.03}s` }}>
              <td style={{ padding: "8px 4px" }}>{getRankBadge(team.rank)}</td>
              <td style={{ padding: "8px 12px", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {team.team_name}
                  </span>
                </div>
              </td>
              <td style={{ padding: "8px 4px", fontWeight: 700, color: team.wwcd > 0 ? "var(--orange-500)" : "inherit" }}>
                {team.wwcd}
              </td>
              <td style={{ padding: "8px 4px" }}>{team.matches_played}</td>
              <td style={{ padding: "8px 4px", fontWeight: 600 }}>{team.total_kills}</td>
              {showMatchBreakdown && layoutMode === "single" &&
                matchNumbers.map((n) => (
                  <td key={n} style={{ padding: "8px 2px", opacity: team.match_points[n] !== undefined ? 1 : 0.3 }}>
                    {team.match_points[n] ?? "—"}
                  </td>
                ))}
              <td style={{ padding: "8px 4px" }}>{team.total_placement_points}</td>
              <td className="total-col" style={{ padding: "8px 6px", fontSize: "1.05rem" }}>
                {team.total_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="standings-wrapper">
      {/* Header Controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <div style={{ display: "flex", background: "rgba(10, 31, 68, 0.12)", padding: 2, borderRadius: 8, gap: 2 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              padding: "4px 10px",
              fontSize: "0.72rem",
              borderRadius: 6,
              background: layoutMode === "split" ? "var(--navy-900)" : "transparent",
              color: layoutMode === "split" ? "white" : "var(--navy-900)",
              fontWeight: 700,
            }}
            onClick={() => setLayoutMode("split")}
          >
            📊 Split View (2-Column No Scroll)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{
              padding: "4px 10px",
              fontSize: "0.72rem",
              borderRadius: 6,
              background: layoutMode === "single" ? "var(--navy-900)" : "transparent",
              color: layoutMode === "single" ? "white" : "var(--navy-900)",
              fontWeight: 700,
            }}
            onClick={() => setLayoutMode("single")}
          >
            📋 Single Table View
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="standings-title" style={{ margin: "0 0 6px" }}>
        {tournamentName ? tournamentName.toUpperCase() : "OVERALL STANDINGS"}
      </h2>

      {/* Subtitle badge */}
      <div className="standings-subtitle" style={{ marginBottom: 18 }}>
        <span>
          {subtitle ||
            (completedMatches === totalMatches && totalMatches > 0
              ? `FINAL — ${completedMatches} MATCHES`
              : `${completedMatches} OF ${totalMatches} MATCHES COMPLETED (${standings.length} TEAMS)`)}
        </span>
      </div>

      {/* Main Leaderboard Display */}
      {layoutMode === "split" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Left Column: Top Half */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--navy-900)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🏆 Rank #1 to #{halfIndex}
            </div>
            {renderTableSection(leftHalf, false)}
          </div>

          {/* Right Column: Bottom Half */}
          {rightHalf.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--navy-900)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎯 Rank #{halfIndex + 1} to #{standings.length}
              </div>
              {renderTableSection(rightHalf, true)}
            </div>
          )}
        </div>
      ) : (
        renderTableSection(standings, false)
      )}

      {/* Compact Legend */}
      <div
        style={{
          marginTop: 14,
          textAlign: "center",
          fontSize: "0.68rem",
          color: "var(--navy-900)",
          opacity: 0.7,
          fontWeight: 700,
          letterSpacing: "0.03em",
        }}
      >
        WIN = 1st Place Finishes &nbsp;|&nbsp; PTS(K) = Kill Points (1 pt/kill) &nbsp;|&nbsp; POS = Placement Points &nbsp;|&nbsp; TOT = Total Points
      </div>
    </div>
  );
}
