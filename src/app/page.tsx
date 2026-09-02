import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TournamentCard from "@/components/TournamentCard";

import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  total_matches: number;
  created_at: string;
  _count: { teams: number; matches: number };
}

async function getTournaments(): Promise<Tournament[]> {
  try {
    const supabase = createServerSupabase();
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        teams:teams(count),
        matches:matches(count)
      `)
      .order("created_at", { ascending: false });

    if (error || !tournaments) return [];

    return tournaments.map((t) => ({
      ...t,
      _count: {
        teams: t.teams?.[0]?.count ?? 0,
        matches: t.matches?.[0]?.count ?? 0,
      },
      teams: undefined,
      matches: undefined,
    }));
  } catch (err) {
    console.error("Error fetching tournaments on home page:", err);
    return [];
  }
}

export default async function HomePage() {
  const tournaments = await getTournaments();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "32px 24px" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.5rem",
              color: "var(--navy-900)",
              letterSpacing: "0.04em",
              margin: 0,
            }}
          >
            ESPORTS TOURNAMENTS
          </h2>
          <div className="section-divider" style={{ maxWidth: 200, margin: "8px auto 16px" }} />
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "1rem",
              maxWidth: 500,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Live scoreboards and standings for Free Fire &amp; BGMI tournaments
          </p>
        </div>

        {/* Tournament Grid */}
        {tournaments.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
            className="stagger-children"
          >
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                id={t.id}
                name={t.name}
                game={t.game}
                status={t.status}
                teamCount={t._count.teams}
                matchCount={t.total_matches || t._count.matches}
                createdAt={t.created_at}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "var(--bg-card)",
              borderRadius: 16,
              border: "2px dashed var(--border-default)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎮</div>
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--navy-900)",
                margin: "0 0 8px",
              }}
            >
              No Tournaments Yet
            </h3>
            <p style={{ color: "var(--text-secondary)", margin: 0, maxWidth: 400, marginInline: "auto" }}>
              Tournaments will appear here once a scorer creates one from the admin dashboard.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
