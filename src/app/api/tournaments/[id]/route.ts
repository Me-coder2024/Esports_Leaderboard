import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tournaments/[id] - Get single tournament with teams, matches, results
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: true,
        matches: {
          include: {
            results: {
              include: { team: true },
            },
          },
          orderBy: { matchNumber: "asc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch {
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

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only allow certain fields to be updated
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.totalMatches !== undefined) updateData.totalMatches = body.totalMatches;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.bannerUrl !== undefined) updateData.bannerUrl = body.bannerUrl;

    const updated = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}
