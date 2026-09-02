import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

// GET /api/tournaments - List all tournaments
export async function GET() {
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

    if (error) throw error;

    // Transform the count format
    const result = tournaments.map((t) => ({
      ...t,
      _count: {
        teams: t.teams?.[0]?.count ?? 0,
        matches: t.matches?.[0]?.count ?? 0,
      },
      teams: undefined,
      matches: undefined,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to fetch tournaments:", err);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: Request) {
  try {
    const { name, game, banner_url } = await request.json();

    if (!name || !game) {
      return NextResponse.json(
        { error: "Name and game type are required" },
        { status: 400 }
      );
    }

    if (!["FREE_FIRE", "BGMI"].includes(game)) {
      return NextResponse.json(
        { error: "Game must be FREE_FIRE or BGMI" },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .insert({ name, game, banner_url })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(tournament, { status: 201 });
  } catch (err) {
    console.error("Failed to create tournament:", err);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}
