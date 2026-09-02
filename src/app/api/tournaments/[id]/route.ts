import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// GET /api/tournaments/[id] - Get single tournament with teams, matches, results
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Fetch teams
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id)
      .order("team_name");

    // Fetch matches with results
    const { data: matches } = await supabase
      .from("matches")
      .select(`
        *,
        results:match_results(
          *,
          team:teams(*)
        )
      `)
      .eq("tournament_id", id)
      .order("match_number");

    return NextResponse.json({
      ...tournament,
      teams: teams || [],
      matches: matches || [],
    });
  } catch (err) {
    console.error("Failed to fetch tournament:", err);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id] - Update tournament
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabase();

    // Check existence
    const { data: existing } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.total_matches !== undefined) updateData.total_matches = body.total_matches;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.banner_url !== undefined) updateData.banner_url = body.banner_url;

    const { data: updated, error } = await supabase
      .from("tournaments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update tournament:", err);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    // 1. Get all matches and teams for this tournament
    const [{ data: matches }, { data: teams }] = await Promise.all([
      supabase.from("matches").select("id").eq("tournament_id", id),
      supabase.from("teams").select("id").eq("tournament_id", id),
    ]);

    const matchIds = (matches || []).map((m) => m.id);
    const teamIds = (teams || []).map((t) => t.id);

    // 2. Delete match_results first
    if (matchIds.length > 0) {
      await supabase.from("match_results").delete().in("match_id", matchIds);
    }
    if (teamIds.length > 0) {
      await supabase.from("match_results").delete().in("team_id", teamIds);
    }

    // 3. Delete matches and teams
    if (matchIds.length > 0) {
      await supabase.from("matches").delete().eq("tournament_id", id);
    }
    if (teamIds.length > 0) {
      await supabase.from("teams").delete().eq("tournament_id", id);
    }

    // 4. Delete the tournament
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase tournament delete error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete tournament:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
