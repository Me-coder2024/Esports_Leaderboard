"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StandingsTable, { type TeamStanding } from "@/components/StandingsTable";

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  total_matches: number;
}

interface StandingsData {
  standings: TeamStanding[];
  total_matches: number;
  completed_matches: number;
}

export default function TournamentPage() {
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/tournaments/${id}`),
        fetch(`/api/tournaments/${id}/standings`),
      ]);

      if (!tRes.ok) {
        setError("Tournament not found");
        return;
      }

      const tData = await tRes.json();
      const sData = await sRes.json();

      setTournament(tData);
      setStandingsData(sData);
    } catch {
      setError("Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function getGameLabel(game: string) {
    return game === "FREE_FIRE" ? "🔥 Free Fire" : "🎯 BGMI";
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ color: "var(--navy-900)" }} />
            <p style={{ marginTop: 16, color: "var(--text-secondary)", fontWeight: 600 }}>
              Loading tournament...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
            <h2 style={{ color: "var(--navy-900)", fontWeight: 700 }}>
              {error || "Tournament not found"}
            </h2>
            <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
              ← Back to Home
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px 24px" }}>
        {/* Tournament Info */}
        <div
          className="animate-fade-in"
          style={{
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <span className={`badge ${tournament.game === "FREE_FIRE" ? "badge-freefire" : "badge-bgmi"}`}>
              {getGameLabel(tournament.game)}
            </span>
            {getStatusBadge(tournament.status)}
          </div>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.2rem",
              color: "var(--navy-900)",
              letterSpacing: "0.04em",
              margin: "0 0 4px",
            }}
          >
            {tournament.name}
          </h1>

          {/* Auto-refresh indicator */}
          {tournament.status === "IN_PROGRESS" && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "8px 0 0" }}>
              🔄 Auto-refreshing every 30 seconds
            </p>
          )}
        </div>

        {/* Standings */}
        {standingsData && (
          <div className="animate-slide-up">
            <StandingsTable
              standings={standingsData.standings}
              totalMatches={standingsData.total_matches}
              completedMatches={standingsData.completed_matches}
              showMatchBreakdown={true}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
