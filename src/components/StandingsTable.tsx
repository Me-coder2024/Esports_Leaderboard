"use client";

import React from "react";

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
  return <span style={{ fontWeight: 800, fontSize: "1rem" }}>{rank}</span>;
}

export default function StandingsTable({
  standings,
  totalMatches,
  completedMatches,
  tournamentName,
  subtitle,
  showMatchBreakdown = false,
}: StandingsTableProps) {
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

  return (
    <div className="standings-wrapper">
      {/* Title */}
      <h2 className="standings-title">
        {tournamentName ? tournamentName.toUpperCase() : "OVERALL STANDINGS"}
      </h2>

      {/* Subtitle badge */}
      <div className="standings-subtitle">
        <span>
          {subtitle ||
            (completedMatches === totalMatches
              ? `FINAL — ${completedMatches} MATCHES`
              : `${completedMatches} OF ${totalMatches} MATCHES COMPLETED`)}
        </span>
      </div>

      {/* Table */}
      <div className="table-scroll-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>WWCD</th>
              <th>Matches</th>
              <th>Finishes</th>
              {showMatchBreakdown &&
                matchNumbers.map((n) => (
                  <th key={n}>M{n}</th>
                ))}
              <th>Pos. Pts.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody className="stagger-children">
            {standings.map((team) => (
              <tr key={team.team_id}>
                <td>{getRankBadge(team.rank)}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{team.team_name}</span>
                  </div>
                </td>
                <td>{team.wwcd}</td>
                <td>{team.matches_played}</td>
                <td>{team.total_kills}</td>
                {showMatchBreakdown &&
                  matchNumbers.map((n) => (
                    <td key={n} style={{ opacity: team.match_points[n] !== undefined ? 1 : 0.3 }}>
                      {team.match_points[n] ?? "—"}
                    </td>
                  ))}
                <td>{team.total_placement_points}</td>
                <td className="total-col">{team.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 16,
          textAlign: "center",
          fontSize: "0.7rem",
          color: "var(--navy-900)",
          opacity: 0.6,
          fontWeight: 600,
        }}
      >
        FINISHES = Total Kills &nbsp;|&nbsp; POS. PTS. = Placement Points &nbsp;|&nbsp; TOTAL = Pos. Pts. + Finishes
      </div>
    </div>
  );
}
