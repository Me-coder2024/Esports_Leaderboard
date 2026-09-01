import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tournaments - List all tournaments
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: Request) {
  try {
    const { name, game, bannerUrl } = await request.json();

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

    const tournament = await prisma.tournament.create({
      data: { name, game, bannerUrl },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}
