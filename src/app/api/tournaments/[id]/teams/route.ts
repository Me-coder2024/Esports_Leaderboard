import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// GET /api/tournaments/[id]/teams
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    const { data: teams, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", id)
      .order("team_name");

    if (error) throw error;

    return NextResponse.json(teams);
  } catch (err) {
    console.error("Failed to fetch teams:", err);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/tournaments/[id]/teams - Add a team
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { team_name, team_leader_name, logo_url } = await request.json();

    if (!team_name || !team_name.trim()) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Check tournament exists and is in SETUP
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("status")
      .eq("id", id)
      .single();

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }
    if (tournament.status !== "SETUP") {
      return NextResponse.json(
        { error: "Cannot add teams after tournament has started" },
        { status: 400 }
      );
    }

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        tournament_id: id,
        team_name: team_name.trim(),
        team_leader_name: team_leader_name?.trim() || "",
        logo_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    console.error("Failed to create team:", err);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
