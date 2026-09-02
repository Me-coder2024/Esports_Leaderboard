import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { calculatePoints, type GameType } from "@/lib/scoring";

// GET /api/tournaments/[id]/matches/[matchNumber]/results
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; matchNumber: string }> }
) {
  try {
    const { id, matchNumber } = await params;
    const supabase = createServerSupabase();

    // Find the match
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", id)
      .eq("match_number", parseInt(matchNumber))
      .single();

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Get results with team info
    const { data: results, error } = await supabase
      .from("match_results")
      .select(`
        *,
        team:teams(*)
      `)
      .eq("match_id", match.id)
      .order("placement");

    if (error) throw error;

    return NextResponse.json({
      match,
      results: results || [],
    });
  } catch (err) {
    console.error("Failed to fetch match results:", err);
    return NextResponse.json(
      { error: "Failed to fetch match results" },
      { status: 500 }
    );
  }
}

// POST /api/tournaments/[id]/matches/[matchNumber]/results - Submit/update match results
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; matchNumber: string }> }
) {
  try {
    const { id, matchNumber } = await params;
    const { results } = await request.json();
    // results: Array<{ team_id: string, placement: number, kills: number }>

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "Results array is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Get tournament to know the game type
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("game")
      .eq("id", id)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Find the match
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("tournament_id", id)
      .eq("match_number", parseInt(matchNumber))
      .single();

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Validate no duplicate placements
    const placements = results.map((r: { placement: number }) => r.placement);
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      return NextResponse.json(
        { error: "Duplicate placements are not allowed — each team must have a unique rank" },
        { status: 400 }
      );
    }

    // Calculate points for each result
    const game = tournament.game as GameType;
    const matchResults = results.map(
      (r: { team_id: string; placement: number; kills: number }) => {
        const points = calculatePoints(game, r.placement, r.kills);
        return {
          match_id: match.id,
          team_id: r.team_id,
          placement: r.placement,
          kills: r.kills,
          placement_points: points.placementPoints,
          elimination_points: points.eliminationPoints,
          total_points: points.totalPoints,
        };
      }
    );

    // Delete existing results for this match (for edit/resubmit)
    await supabase
      .from("match_results")
      .delete()
      .eq("match_id", match.id);

    // Insert new results
    const { error: insertError } = await supabase
      .from("match_results")
      .insert(matchResults);

    if (insertError) throw insertError;

    // Mark match as completed
    await supabase
      .from("matches")
      .update({ status: "COMPLETED" })
      .eq("id", match.id);

    // Check if all matches are completed
    const { count: pendingCount } = await supabase
      .from("matches")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", id)
      .eq("status", "PENDING");

    // If all matches done, mark tournament as completed
    if (pendingCount === 0) {
      await supabase
        .from("tournaments")
        .update({ status: "COMPLETED" })
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to submit match results:", err);
    return NextResponse.json(
      { error: "Failed to submit match results" },
      { status: 500 }
    );
  }
}
