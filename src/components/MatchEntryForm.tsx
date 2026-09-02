"use client";

import React, { useState } from "react";

interface Team {
  id: string;
  team_name: string;
  team_leader_name: string;
}

interface MatchResultEntry {
  team_id: string;
  placement: number | "";
  kills: number | "";
}

interface MatchEntryFormProps {
  teams: Team[];
  matchNumber: number;
  initialResults?: Array<{
    team_id: string;
    placement: number;
    kills: number;
  }>;
  onSubmit: (results: Array<{ team_id: string; placement: number; kills: number }>) => Promise<void>;
  isCompleted?: boolean;
}

export default function MatchEntryForm({
  teams,
  matchNumber,
  initialResults,
  onSubmit,
  isCompleted = false,
}: MatchEntryFormProps) {
  const [editing, setEditing] = useState(!isCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<MatchResultEntry[]>(() =>
    teams.map((team) => {
      const existing = initialResults?.find((r) => r.team_id === team.id);
      return {
        team_id: team.id,
        placement: existing?.placement ?? "",
        kills: existing?.kills ?? "",
      };
    })
  );

  function updateEntry(teamId: string, field: "placement" | "kills", value: string) {
    const num = value === "" ? "" : parseInt(value);
    setEntries((prev) =>
      prev.map((e) => (e.team_id === teamId ? { ...e, [field]: num } : e))
    );
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate all fields filled
    for (const entry of entries) {
      if (entry.placement === "" || entry.kills === "") {
        setError("All teams must have a placement and kills value.");
        return;
      }
      if (typeof entry.placement === "number" && entry.placement < 1) {
        setError("Placement must be 1 or greater.");
        return;
      }
      if (typeof entry.kills === "number" && entry.kills < 0) {
        setError("Kills cannot be negative.");
        return;
      }
    }

    // Validate no duplicate placements
    const placements = entries.map((e) => e.placement as number);
    const unique = new Set(placements);
    if (unique.size !== placements.length) {
      setError("Each team must have a unique placement. No ties allowed.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(
        entries.map((e) => ({
          team_id: e.team_id,
          placement: e.placement as number,
          kills: e.kills as number,
        }))
      );
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit results");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Match Header */}
      <div
        style={{
          background: isCompleted && !editing
            ? "linear-gradient(135deg, #16A34A, #22C55E)"
            : "linear-gradient(135deg, var(--navy-900), var(--navy-700))",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.3rem",
              letterSpacing: "0.05em",
            }}
          >
            MATCH {matchNumber}
          </span>
          {isCompleted && !editing && (
            <span
              style={{
                background: "rgba(255,255,255,0.25)",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              ✓ COMPLETED
            </span>
          )}
        </div>

        {isCompleted && !editing && (
          <button
            className="btn btn-sm"
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
            onClick={() => setEditing(true)}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Entry Form */}
      {editing ? (
        <form onSubmit={handleSubmit}>
          {/* Column Headers */}
          <div
            className="match-entry-row"
            style={{
              background: "var(--bg-table-alt)",
              fontWeight: 700,
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              padding: "8px 16px",
            }}
          >
            <div>Team</div>
            <div style={{ textAlign: "center" }}>Rank</div>
            <div style={{ textAlign: "center" }}>Kills</div>
          </div>

          {/* Team Rows */}
          <div style={{ padding: "4px 0" }}>
            {teams.map((team, index) => {
              const entry = entries.find((e) => e.team_id === team.id);
              return (
                <div
                  key={team.id}
                  className="match-entry-row"
                  style={{
                    animationDelay: `${index * 0.03}s`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{team.team_name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {team.team_leader_name}
                    </div>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={teams.length}
                    className="input-field input-field-compact"
                    placeholder="#"
                    value={entry?.placement ?? ""}
                    onChange={(e) => updateEntry(team.id, "placement", e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    className="input-field input-field-compact"
                    placeholder="0"
                    value={entry?.kills ?? ""}
                    onChange={(e) => updateEntry(team.id, "kills", e.target.value)}
                  />
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                margin: "0 16px",
                padding: "10px 14px",
                background: "#FEF2F2",
                color: "#B91C1C",
                borderRadius: 8,
                fontSize: "0.8rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ padding: "16px 16px 20px", display: "flex", gap: 12 }}>
            <button
              type="submit"
              className="btn btn-success btn-lg"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Saving...
                </>
              ) : isCompleted ? (
                "💾 Update Results"
              ) : (
                "✅ Submit Match Results"
              )}
            </button>
            {isCompleted && editing && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        /* Read-only summary when completed */
        <div style={{ padding: "12px 16px 16px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {entries
              .sort((a, b) => (a.placement as number) - (b.placement as number))
              .map((entry) => {
                const team = teams.find((t) => t.id === entry.team_id);
                return (
                  <div
                    key={entry.team_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>
                        #{entry.placement}
                      </strong>{" "}
                      {team?.team_name}
                    </span>
                    <span style={{ fontWeight: 600 }}>{entry.kills} kills</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
