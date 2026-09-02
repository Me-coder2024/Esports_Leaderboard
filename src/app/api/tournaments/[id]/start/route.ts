import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// POST /api/tournaments/[id]/start - Start tournament, generate match slots
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    // Get tournament
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("*")
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
        { error: "Tournament has already been started" },
        { status: 400 }
      );
    }

    if (tournament.total_matches < 1) {
      return NextResponse.json(
        { error: "Please set the number of matches before starting" },
        { status: 400 }
      );
    }

    // Check at least 2 teams
    const { count } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", id);

    if (!count || count < 2) {
      return NextResponse.json(
        { error: "At least 2 teams are required to start a tournament" },
        { status: 400 }
      );
    }

    // Generate match slots
    const matchSlots = Array.from(
      { length: tournament.total_matches },
      (_, i) => ({
        tournament_id: id,
        match_number: i + 1,
        status: "PENDING",
      })
    );

    const { error: matchError } = await supabase
      .from("matches")
      .insert(matchSlots);

    if (matchError) throw matchError;

    // Update tournament status
    const { data: updated, error: updateError } = await supabase
      .from("tournaments")
      .update({ status: "IN_PROGRESS" })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to start tournament:", err);
    return NextResponse.json(
      { error: "Failed to start tournament" },
      { status: 500 }
    );
  }
}
