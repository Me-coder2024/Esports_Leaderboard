"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MatchEntryForm from "@/components/MatchEntryForm";
import StandingsTable, { type TeamStanding } from "@/components/StandingsTable";

type GameType = "FREE_FIRE" | "BGMI";

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  total_matches: number;
  teams: Team[];
  matches: Match[];
}

interface Team {
  id: string;
  team_name: string;
  team_leader_name: string;
  tournament_id: string;
}

interface Match {
  id: string;
  match_number: number;
  status: string;
  results: MatchResult[];
}

interface MatchResult {
  id: string;
  team_id: string;
  placement: number;
  kills: number;
  placement_points: number;
  elimination_points: number;
  total_points: number;
  team: Team;
}

interface StandingsData {
  standings: TeamStanding[];
  total_matches: number;
  completed_matches: number;
}

// Step definitions
const STEPS = [
  { label: "Game", icon: "🎮" },
  { label: "Create", icon: "📋" },
  { label: "Teams", icon: "👥" },
  { label: "Matches", icon: "#️⃣" },
  { label: "Start", icon: "🚀" },
  { label: "Score", icon: "📝" },
];

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

export default function ScoreDashboard() {
  const router = useRouter();

  // -- State --
  const [step, setStep] = useState(0);
  const [game, setGame] = useState<GameType | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<StandingsData | null>(null);

  // Form state
  const [tournamentName, setTournamentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [matchCount, setMatchCount] = useState("");
  const [activeMatchTab, setActiveMatchTab] = useState(1);

  // Inline team editing state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editLeaderName, setEditLeaderName] = useState("");

  // Delete modal state
  const [tournamentToDelete, setTournamentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Existing tournaments list
  const [existingTournaments, setExistingTournaments] = useState<Tournament[]>([]);
  const [showExisting, setShowExisting] = useState(false);

  const refreshTournamentList = useCallback(async () => {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExistingTournaments(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshTournamentList();
  }, [refreshTournamentList]);

  // Fetch tournament data without involuntarily changing step
  const fetchTournament = useCallback(
    async (id: string, autoAdvance: boolean = false) => {
      try {
        const res = await fetch(`/api/tournaments/${id}`);
        if (!res.ok) return;
        const data: Tournament = await res.json();
        setTournament(data);
        setGame(data.game as GameType);

        // Only auto-determine step if explicitly asked (e.g. quick-load)
        if (autoAdvance) {
          if (data.status === "IN_PROGRESS" || data.status === "COMPLETED") {
            setStep(5);
          } else if (data.total_matches > 0) {
            setStep(4);
          } else if (data.teams && data.teams.length > 0) {
            setStep(2);
          } else {
            setStep(2);
          }
        }

        // Fetch standings
        const sRes = await fetch(`/api/tournaments/${id}/standings`);
        if (sRes.ok) {
          setStandings(await sRes.json());
        }
      } catch (err) {
        console.error("Error fetching tournament:", err);
      }
    },
    []
  );

  // -- Handlers --

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function handleStartNewTournament() {
    setTournament(null);
    setGame(null);
    setTournamentName("");
    setTeamName("");
    setLeaderName("");
    setMatchCount("");
    setStandings(null);
    setStep(0);
  }

  async function handleCreateTournament() {
    if (!tournamentName.trim() || !game) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tournamentName.trim(), game }),
      });
      if (!res.ok) throw new Error("Failed to create tournament");
      const data = await res.json();
      await fetchTournament(data.id, false);
      await refreshTournamentList();
      setStep(2); // Move to Add Teams step
      setToast({ message: "Tournament created! Now add your teams.", type: "success" });
    } catch {
      setToast({ message: "Failed to create tournament", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDeleteTournament() {
    if (!tournamentToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete tournament");
      }

      // If the currently active tournament was deleted, reset state
      if (tournament && tournament.id === tournamentToDelete.id) {
        handleStartNewTournament();
      }

      await refreshTournamentList();
      setToast({
        message: `Tournament "${tournamentToDelete.name}" deleted!`,
        type: "success",
      });
      setTournamentToDelete(null);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to delete tournament",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeam() {
    if (!teamName.trim() || !tournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: teamName.trim(),
          team_leader_name: leaderName.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add team");
      }
      const addedTeamName = teamName.trim();
      setTeamName("");
      setLeaderName("");
      // Refresh tournament data but STAY on step 2 (Add Teams)
      await fetchTournament(tournament.id, false);
      setToast({ message: `Team "${addedTeamName}" added!`, type: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to add team",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  function startEditingTeam(team: Team) {
    setEditingTeamId(team.id);
    setEditTeamName(team.team_name);
    setEditLeaderName(team.team_leader_name || "");
  }

  function cancelEditingTeam() {
    setEditingTeamId(null);
    setEditTeamName("");
    setEditLeaderName("");
  }

  async function handleSaveEditTeam(teamId: string) {
    if (!editTeamName.trim() || !tournament) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournament.id}/teams/${teamId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_name: editTeamName.trim(),
            team_leader_name: editLeaderName.trim(),
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update team");
      await fetchTournament(tournament.id, false);
      cancelEditingTeam();
      setToast({ message: "Team updated successfully!", type: "success" });
    } catch {
      setToast({ message: "Failed to update team", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!tournament) return;
    try {
      const res = await fetch(
        `/api/tournaments/${tournament.id}/teams/${teamId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete team");
      await fetchTournament(tournament.id, false);
      setToast({ message: "Team removed", type: "success" });
    } catch {
      setToast({ message: "Failed to remove team", type: "error" });
    }
  }

  async function handleSetMatchCount() {
    if (!matchCount || !tournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_matches: parseInt(matchCount) }),
      });
      if (!res.ok) throw new Error("Failed to set match count");
      await fetchTournament(tournament.id, false);
      setStep(4);
      setToast({ message: `${matchCount} matches configured!`, type: "success" });
    } catch {
      setToast({ message: "Failed to set match count", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTournament() {
    if (!tournament) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start tournament");
      }
      await fetchTournament(tournament.id, false);
      setStep(5);
      setToast({ message: "Tournament started! Match scoring active 🎮", type: "success" });
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to start tournament",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitMatchResults(
    matchNumber: number,
    results: Array<{ team_id: string; placement: number; kills: number }>
  ) {
    if (!tournament) return;
    const res = await fetch(
      `/api/tournaments/${tournament.id}/matches/${matchNumber}/results`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to submit results");
    }

    await fetchTournament(tournament.id, false);
    setToast({
      message: `Match ${matchNumber} results calculated & saved!`,
      type: "success",
    });
  }

  // -- Render helpers --

  const currentStep = Math.min(step, STEPS.length - 1);

  function renderStepIndicator() {
    return (
      <div
        className="step-indicator"
        style={{ maxWidth: 540, margin: "0 auto 32px" }}
      >
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div
              className={`step-dot ${
                i < currentStep
                  ? "step-dot-completed"
                  : i === currentStep
                  ? "step-dot-active"
                  : "step-dot-pending"
              }`}
              style={{ cursor: i <= currentStep ? "pointer" : "default" }}
              onClick={() => {
                if (i <= currentStep) setStep(i);
              }}
              title={s.label}
            >
              {i < currentStep ? "✓" : s.icon}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`step-line ${
                  i < currentStep ? "step-line-completed" : ""
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Helper to render team rows with inline editing
  function renderTeamList(teams: Team[], canDelete: boolean = true) {
    if (!teams || teams.length === 0) {
      return (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            background: "var(--bg-table-alt)",
            borderRadius: 10,
            color: "var(--text-muted)",
            fontSize: "0.85rem",
          }}
        >
          No teams added yet. Add teams above to populate the tournament.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {teams.map((team, i) => {
          const isEditing = editingTeamId === team.id;

          if (isEditing) {
            return (
              <div
                key={team.id}
                style={{
                  background: "#EFF6FF",
                  border: "1.5px solid var(--navy-500)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--navy-900)" }}>
                  Editing Team #{i + 1}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px" }}>
                    <label className="label" style={{ fontSize: "0.7rem" }}>
                      Team Name *
                    </label>
                    <input
                      className="input-field"
                      style={{ padding: "8px 12px" }}
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      placeholder="Team Name"
                      autoFocus
                    />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <label className="label" style={{ fontSize: "0.7rem" }}>
                      Player / Leader Name (Optional)
                    </label>
                    <input
                      className="input-field"
                      style={{ padding: "8px 12px" }}
                      value={editLeaderName}
                      onChange={(e) => setEditLeaderName(e.target.value)}
                      placeholder="e.g. John / Captain IGN"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={cancelEditingTeam}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={loading || !editTeamName.trim()}
                    onClick={() => handleSaveEditTeam(team.id)}
                  >
                    💾 Save Changes
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={team.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: i % 2 === 0 ? "var(--bg-table-alt)" : "transparent",
                borderRadius: 8,
                border: "1px solid var(--border-default)",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: "var(--navy-900)",
                    background: "rgba(10, 31, 68, 0.08)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  #{i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {team.team_name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: team.team_leader_name ? "var(--text-secondary)" : "var(--text-muted)",
                      fontStyle: team.team_leader_name ? "normal" : "italic",
                    }}
                  >
                    {team.team_leader_name ? `Player/Leader: ${team.team_leader_name}` : "No player/leader specified"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--navy-600)" }}
                  onClick={() => startEditingTeam(team)}
                  title="Edit team name or player name"
                >
                  ✏️ Edit
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--red-600)", padding: "4px 8px" }}
                    onClick={() => handleDeleteTeam(team.id)}
                    title="Remove team"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main
        style={{
          flex: 1,
          maxWidth: step === 5 ? 1400 : 960,
          margin: "0 auto",
          width: "100%",
          padding: "24px 20px",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2rem",
                color: "var(--navy-900)",
                letterSpacing: "0.04em",
                margin: 0,
              }}
            >
              SCORER DASHBOARD
            </h1>
            {tournament && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Active: <strong>{tournament.name}</strong> ({tournament.game === "FREE_FIRE" ? "🔥 Free Fire" : "🎯 BGMI"})
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {tournament && (
              <>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleStartNewTournament}
                  title="Start a new tournament"
                >
                  ➕ New Tournament
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setTournamentToDelete({
                      id: tournament.id,
                      name: tournament.name,
                    })
                  }
                  title="Delete this tournament"
                >
                  🗑️ Delete Tournament
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Existing Tournament Quick-Load & Management */}
        {existingTournaments.length > 0 && (
          <div
            className="animate-fade-in"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setShowExisting(!showExisting)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.9rem", color: "var(--navy-900)" }}>
                <span>📁 Existing Tournaments ({existingTournaments.length})</span>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px 8px" }}
              >
                {showExisting ? "▲ Hide List" : "▼ Manage & Load Tournaments"}
              </button>
            </div>

            {showExisting && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {existingTournaments.map((t) => {
                  const isCurrent = tournament?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: isCurrent ? "#EFF6FF" : "var(--bg-table-alt)",
                        border: isCurrent ? "1.5px solid var(--navy-500)" : "1px solid var(--border-default)",
                        borderRadius: 8,
                        gap: 12,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{
                          flex: 1,
                          justifyContent: "flex-start",
                          textAlign: "left",
                          padding: "4px 6px",
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? "var(--navy-900)" : "inherit",
                        }}
                        onClick={() => {
                          fetchTournament(t.id, true);
                          setShowExisting(false);
                        }}
                      >
                        <span
                          className={`badge ${
                            t.game === "FREE_FIRE"
                              ? "badge-freefire"
                              : "badge-bgmi"
                          }`}
                          style={{ fontSize: "0.6rem", padding: "2px 6px", marginRight: 6 }}
                        >
                          {t.game === "FREE_FIRE" ? "FF" : "BGMI"}
                        </span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.name}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: "0.7rem", color: "var(--navy-600)", marginLeft: 6 }}>
                            (Active)
                          </span>
                        )}
                        <span
                          className={`badge-status ${
                            t.status === "SETUP"
                              ? "badge-setup"
                              : t.status === "IN_PROGRESS"
                              ? "badge-in-progress"
                              : "badge-completed"
                          }`}
                          style={{ marginLeft: "auto", fontSize: "0.6rem" }}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </button>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <a
                          href={`/tournament/${t.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          title="View public scorecard"
                        >
                          ↗ View
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red-600)", padding: "4px 8px", fontSize: "0.75rem" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTournamentToDelete({ id: t.id, name: t.name });
                          }}
                          title="Delete tournament"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 0: SELECT GAME ============ */}
        {step === 0 && !tournament && (
          <div className="animate-fade-in">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "var(--navy-900)",
                }}
              >
                Step 1: Select Game
              </h2>
              <div className="section-divider" />
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginBottom: 20,
                }}
              >
                Choose the game type: <strong>Free Fire</strong> (Official 12-Pt System: 12-9-8-7-6-5-4-3-2-1) or <strong>BGMI</strong> (Official 10-Pt System: 10-6-5-4-3-2-1-1). Both games award <strong>+1 point per kill</strong>.
              </p>

              <div className="game-toggle">
                <button
                  type="button"
                  className={`game-toggle-option ${
                    game === "FREE_FIRE" ? "active freefire" : ""
                  }`}
                  onClick={() => setGame("FREE_FIRE")}
                >
                  🔥 Free Fire
                </button>
                <button
                  type="button"
                  className={`game-toggle-option ${
                    game === "BGMI" ? "active bgmi" : ""
                  }`}
                  onClick={() => setGame("BGMI")}
                >
                  🎯 BGMI
                </button>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: "100%", marginTop: 24 }}
                disabled={!game}
                onClick={() => setStep(1)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 1: CREATE TOURNAMENT ============ */}
        {step === 1 && !tournament && (
          <div className="animate-fade-in">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "var(--navy-900)",
                }}
              >
                Step 2: Create Tournament
              </h2>
              <div className="section-divider" />

              <div style={{ marginBottom: 20 }}>
                <label className="label">Tournament Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. Lakshya Free Fire Championship 2026"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  autoFocus
                />
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-table-alt)",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Selected Game:{" "}
                  <strong>
                    {game === "FREE_FIRE" ? "🔥 Free Fire" : "🎯 BGMI"}
                  </strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  disabled={loading || !tournamentName.trim()}
                  onClick={handleCreateTournament}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Creating...
                    </>
                  ) : (
                    "Create Tournament & Add Teams →"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 2: ADD TEAMS ============ */}
        {step === 2 && tournament && (
          <div className="animate-fade-in">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      margin: "0 0 4px",
                      color: "var(--navy-900)",
                    }}
                  >
                    Step 3: Add Tournament Teams
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    You can add just the <strong>Team Name</strong> now and edit/add player names anytime before starting.
                  </p>
                </div>
                <span
                  style={{
                    background: "var(--navy-900)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {tournament.teams?.length || 0} Teams Added
                </span>
              </div>

              <div className="section-divider" />

              {/* Add team form */}
              <div
                style={{
                  background: "var(--bg-table-alt)",
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid var(--border-default)",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--navy-900)", marginBottom: 12 }}>
                  ➕ Quick Add Team
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 200px" }}>
                    <label className="label">
                      Team Name <span style={{ color: "var(--red-600)" }}>*</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Soul, GodLike, Team Elite"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTeam();
                      }}
                      autoFocus
                    />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label className="label">
                      Player / Leader Name <span style={{ color: "var(--text-muted)", textTransform: "none" }}>(Optional)</span>
                    </label>
                    <input
                      className="input-field"
                      placeholder="e.g. Jonathan / Mavi (can add later)"
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTeam();
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ height: 44, paddingInline: 24 }}
                      disabled={loading || !teamName.trim()}
                      onClick={handleAddTeam}
                    >
                      {loading ? <span className="spinner" /> : "Add Team"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Team list with edit & delete */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--navy-900)",
                      margin: 0,
                    }}
                  >
                    Registered Teams ({tournament.teams?.length || 0})
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Click <strong>✏️ Edit</strong> on any team to update team or player name
                  </span>
                </div>

                {renderTeamList(tournament.teams || [], true)}
              </div>

              {/* Navigation button */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  disabled={!tournament.teams || tournament.teams.length < 2}
                  onClick={() => setStep(3)}
                >
                  Continue → Set Number of Matches ({tournament.teams?.length || 0} Teams)
                </button>
              </div>
              {(!tournament.teams || tournament.teams.length < 2) && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--red-600)",
                    marginTop: 10,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Add at least 2 teams to proceed to match configuration.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============ STEP 3: SET MATCH COUNT ============ */}
        {step === 3 && tournament && (
          <div className="animate-fade-in">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  margin: "0 0 4px",
                  color: "var(--navy-900)",
                }}
              >
                Step 4: Set Number of Matches
              </h2>
              <div className="section-divider" />

              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: 20 }}>
                How many matches will be played in this tournament stage?
              </p>

              <div style={{ maxWidth: 280, margin: "0 auto" }}>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input-field"
                  style={{
                    fontSize: "2.4rem",
                    textAlign: "center",
                    fontWeight: 800,
                    padding: "16px",
                    color: "var(--navy-900)",
                  }}
                  placeholder="6"
                  min="1"
                  max="50"
                  value={matchCount || (tournament.total_matches > 0 ? tournament.total_matches : "")}
                  onChange={(e) => setMatchCount(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Select presets */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 28 }}>
                {[3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{
                      background: (matchCount ? parseInt(matchCount) : tournament.total_matches) === num ? "var(--navy-900)" : "transparent",
                      color: (matchCount ? parseInt(matchCount) : tournament.total_matches) === num ? "white" : "var(--navy-900)",
                    }}
                    onClick={() => setMatchCount(num.toString())}
                  >
                    {num} Matches
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  ← Back to Teams
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  disabled={
                    loading ||
                    (!matchCount && (!tournament.total_matches || tournament.total_matches < 1))
                  }
                  onClick={handleSetMatchCount}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Saving...
                    </>
                  ) : (
                    "Save & Review Tournament →"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 4: PRE-START REVIEW & FINAL EDIT ============ */}
        {step === 4 && tournament && tournament.status === "SETUP" && (
          <div className="animate-fade-in">
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: 16,
                padding: 32,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  margin: "0 0 4px",
                  color: "var(--navy-900)",
                  textAlign: "center",
                }}
              >
                Step 5: Pre-Tournament Review &amp; Edit
              </h2>
              <div
                className="section-divider"
                style={{ maxWidth: 160, margin: "8px auto 24px" }}
              />

              {/* Summary Stats Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 16,
                  marginBottom: 28,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    background: "var(--bg-table-alt)",
                    padding: "16px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      color: "var(--navy-900)",
                    }}
                  >
                    {tournament.teams?.length || 0}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Total Teams
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-table-alt)",
                    padding: "16px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      color: "var(--navy-900)",
                    }}
                  >
                    {tournament.total_matches}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Matches Planned
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--bg-table-alt)",
                    padding: "16px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      color: "var(--navy-900)",
                    }}
                  >
                    {tournament.game === "FREE_FIRE" ? "🔥 FF" : "🎯 BGMI"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {tournament.game === "FREE_FIRE" ? "12-Pt System" : "10-Pt System"}
                  </div>
                </div>
              </div>

              {/* Pre-Start Team Roster Edit Section */}
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "var(--navy-900)",
                      margin: 0,
                    }}
                  >
                    📋 Team Roster (Edit Names / Player Names Below)
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setStep(2)}
                  >
                    ➕ Add More Teams
                  </button>
                </div>
                {renderTeamList(tournament.teams || [], true)}
              </div>

              <div
                style={{
                  background: "#FEF3C7",
                  border: "1px solid #FCD34D",
                  color: "#92400E",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontSize: "0.8rem",
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                ⚠️ <strong>Note:</strong> Once you click &quot;Start Tournament&quot;, match slots (Match 1 to {tournament.total_matches}) will be created and team additions/deletions will be locked.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setStep(3)}
                >
                  ← Edit Match Count
                </button>
                <button
                  type="button"
                  className="btn btn-orange btn-lg animate-pulse-glow"
                  disabled={loading}
                  onClick={handleStartTournament}
                  style={{ paddingInline: 36 }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Initializing...
                    </>
                  ) : (
                    "🚀 START TOURNAMENT & BEGIN SCORING"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 5: SCORING ============ */}
        {step === 5 &&
          tournament &&
          (tournament.status === "IN_PROGRESS" ||
            tournament.status === "COMPLETED") && (
            <div className="animate-fade-in">
              {/* Tournament info bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: "var(--navy-900)",
                    }}
                  >
                    {tournament.name}
                  </h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span
                      className={`badge ${
                        tournament.game === "FREE_FIRE"
                          ? "badge-freefire"
                          : "badge-bgmi"
                      }`}
                    >
                      {tournament.game === "FREE_FIRE"
                        ? "🔥 Free Fire"
                        : "🎯 BGMI"}
                    </span>
                    <span
                      className={`badge-status ${
                        tournament.status === "IN_PROGRESS"
                          ? "badge-in-progress"
                          : "badge-completed"
                      }`}
                    >
                      {tournament.status === "IN_PROGRESS"
                        ? "🔴 Live Scoring"
                        : "✅ Completed"}
                    </span>
                  </div>
                </div>

                {/* Link to public view */}
                <a
                  href={`/tournament/${tournament.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  🌐 View Public Scorecard ↗
                </a>
              </div>

              {/* Match Tabs */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    overflowX: "auto",
                    paddingBottom: 6,
                  }}
                >
                  {tournament.matches.map((match) => {
                    const isActive = activeMatchTab === match.match_number;
                    const isCompleted = match.status === "COMPLETED";
                    return (
                      <button
                        key={match.id}
                        className={`btn btn-sm ${
                          isActive
                            ? "btn-primary"
                            : isCompleted
                            ? "btn-success"
                            : "btn-outline"
                        }`}
                        style={{
                          minWidth: 56,
                          fontSize: "0.8rem",
                          flexShrink: 0,
                          fontWeight: 700,
                        }}
                        onClick={() => setActiveMatchTab(match.match_number)}
                      >
                        {isCompleted && !isActive ? "✓ " : ""}Match {match.match_number}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Match Form */}
              {tournament.matches.map((match) => {
                if (match.match_number !== activeMatchTab) return null;
                return (
                  <div
                    key={match.id}
                    className="animate-slide-right"
                    style={{ marginBottom: 32 }}
                  >
                    <MatchEntryForm
                      teams={tournament.teams}
                      matchNumber={match.match_number}
                      initialResults={match.results?.map((r) => ({
                        team_id: r.team_id,
                        placement: r.placement,
                        kills: r.kills,
                      }))}
                      isCompleted={match.status === "COMPLETED"}
                      onSubmit={(results) =>
                        handleSubmitMatchResults(match.match_number, results)
                      }
                    />
                  </div>
                );
              })}

              {/* Live Standings Table */}
              {standings && (
                <div style={{ marginTop: 24 }}>
                  <StandingsTable
                    standings={standings.standings}
                    totalMatches={standings.total_matches}
                    completedMatches={standings.completed_matches}
                    tournamentName={tournament.name}
                    showMatchBreakdown={true}
                  />
                </div>
              )}
            </div>
          )}
      </main>

      <Footer />

      {/* Delete Tournament Confirmation Modal */}
      {tournamentToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 24,
          }}
          onClick={() => setTournamentToDelete(null)}
        >
          <div
            className="animate-slide-up"
            style={{
              background: "white",
              borderRadius: 16,
              padding: 28,
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid var(--border-default)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2.4rem", textAlign: "center", marginBottom: 12 }}>
              ⚠️
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--navy-900)",
                margin: "0 0 8px",
                textAlign: "center",
              }}
            >
              Delete Tournament?
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to delete <strong>&quot;{tournamentToDelete.name}&quot;</strong>? All associated teams, matches, and scorecard standings will be permanently removed.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setTournamentToDelete(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleConfirmDeleteTournament}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "🗑️ Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
