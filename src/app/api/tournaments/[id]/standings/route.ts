import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export interface TeamStanding {
  team_id: string;
  team_name: string;
  team_leader_name: string;
  wwcd: number;           // Number of 1st-place finishes
  matches_played: number; // Number of matches with results
  total_kills: number;    // Sum of all kills (finishes)
  total_placement_points: number;
  total_elimination_points: number;
  total_points: number;
  match_points: Record<number, number>; // matchNumber -> points for that match
  rank: number;
}

// GET /api/tournaments/[id]/standings
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id);

    if (teamsError) throw teamsError;

    // Get all matches
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", id)
      .order("match_number");

    if (matchesError) throw matchesError;

    // Get all match results
    const matchIds = (matches || []).map((m) => m.id);
    let allResults: Array<{
      match_id: string;
      team_id: string;
      placement: number;
      kills: number;
      placement_points: number;
      elimination_points: number;
      total_points: number;
    }> = [];

    if (matchIds.length > 0) {
      const { data: results, error: resultsError } = await supabase
        .from("match_results")
        .select("*")
        .in("match_id", matchIds);

      if (resultsError) throw resultsError;
      allResults = results || [];
    }

    // Build a map of matchId -> matchNumber
    const matchNumberMap: Record<string, number> = {};
    for (const m of matches || []) {
      matchNumberMap[m.id] = m.match_number;
    }

    // Aggregate standings per team
    const standingsMap: Record<string, TeamStanding> = {};

    for (const team of teams || []) {
      standingsMap[team.id] = {
        team_id: team.id,
        team_name: team.team_name,
        team_leader_name: team.team_leader_name,
        wwcd: 0,
        matches_played: 0,
        total_kills: 0,
        total_placement_points: 0,
        total_elimination_points: 0,
        total_points: 0,
        match_points: {},
        rank: 0,
      };
    }

    for (const result of allResults) {
      const standing = standingsMap[result.team_id];
      if (!standing) continue;

      const matchNum = matchNumberMap[result.match_id];

      standing.matches_played += 1;
      standing.total_kills += result.kills;
      standing.total_placement_points += result.placement_points;
      standing.total_elimination_points += result.elimination_points;
      standing.total_points += result.total_points;
      standing.match_points[matchNum] = result.total_points;

      if (result.placement === 1) {
        standing.wwcd += 1;
      }
    }

    // Sort by total_points descending, then by wwcd, then by kills
    const standings = Object.values(standingsMap).sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
      return b.total_kills - a.total_kills;
    });

    // Assign ranks
    standings.forEach((s, i) => {
      s.rank = i + 1;
    });

    return NextResponse.json({
      standings,
      total_matches: matches?.length || 0,
      completed_matches: matches?.filter((m) => m.status === "COMPLETED").length || 0,
    });
  } catch (err) {
    console.error("Failed to calculate standings:", err);
    return NextResponse.json(
      { error: "Failed to calculate standings" },
      { status: 500 }
    );
  }
}
