import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// PATCH /api/tournaments/[id]/teams/[teamId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id, teamId } = await params;
    const body = await request.json();
    const supabase = createServerSupabase();

    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("tournament_id", id)
      .single();

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.team_name !== undefined) updateData.team_name = body.team_name;
    if (body.team_leader_name !== undefined) updateData.team_leader_name = body.team_leader_name;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;

    const { data: updated, error } = await supabase
      .from("teams")
      .update(updateData)
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update team:", err);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id]/teams/[teamId]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id, teamId } = await params;
    const supabase = createServerSupabase();

    // Check tournament is in SETUP
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
        { error: "Cannot delete teams after tournament has started" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete team:", err);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
