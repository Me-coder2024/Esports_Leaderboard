// Scoring tables and calculation functions for Free Fire and BGMI tournaments

export type GameType = "FREE_FIRE" | "BGMI";

// Free Fire placement points table
const FREE_FIRE_PLACEMENT: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
};

// BGMI placement points table
const BGMI_PLACEMENT: Record<number, number> = {
  1: 12,
  2: 9,
  3: 8,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
};

export function getPlacementPoints(game: GameType, placement: number): number {
  const table = game === "FREE_FIRE" ? FREE_FIRE_PLACEMENT : BGMI_PLACEMENT;
  return table[placement] ?? 0;
}

export function calculatePoints(
  game: GameType,
  placement: number,
  kills: number
): {
  placementPoints: number;
  eliminationPoints: number;
  totalPoints: number;
} {
  const placementPoints = getPlacementPoints(game, placement);
  const eliminationPoints = kills; // 1 point per kill for both games
  const totalPoints = placementPoints + eliminationPoints;

  return { placementPoints, eliminationPoints, totalPoints };
}

// Check if a placement indicates a win (1st place)
export function isWWCD(placement: number): boolean {
  return placement === 1;
}

// Get the maximum number of teams for a game
export function getMaxTeams(game: GameType): number {
  return game === "FREE_FIRE" ? 18 : 16;
}

// Get the label for 1st place based on game
export function getWinLabel(game: GameType): string {
  return game === "FREE_FIRE" ? "Booyah" : "WWCD";
}
