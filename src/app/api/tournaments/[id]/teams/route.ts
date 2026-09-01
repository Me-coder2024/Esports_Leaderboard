import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tournaments/[id]/teams
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teams = await prisma.team.findMany({
      where: { tournamentId: id },
      orderBy: { teamName: "asc" },
    });

    return NextResponse.json(teams);
  } catch {
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
    const { teamName, teamLeaderName, logoUrl } = await request.json();

    if (!teamName || !teamLeaderName) {
      return NextResponse.json(
        { error: "Team name and leader name are required" },
        { status: 400 }
      );
    }

    // Check tournament exists and is in SETUP
    const tournament = await prisma.tournament.findUnique({ where: { id } });
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

    const team = await prisma.team.create({
      data: {
        tournamentId: id,
        teamName,
        teamLeaderName,
        logoUrl,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
