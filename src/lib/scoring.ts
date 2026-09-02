// Scoring tables and calculation functions for Free Fire and BGMI tournaments

export type GameType = "FREE_FIRE" | "BGMI";

// Free Fire Placement Points Table (Official 12-Point System)
// 1st (Booyah!): 12 pts, 2nd: 9, 3rd: 8, 4th: 7, 5th: 6, 6th: 5, 7th: 4, 8th: 3, 9th: 2, 10th: 1, 11th-12th+: 0
export const FREE_FIRE_PLACEMENT: Record<number, number> = {
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
  11: 0,
  12: 0,
};

// BGMI Placement Points Table (Official Krafton 10-Point System — BGIS / BMPS / BGMS)
// 1st (WWCD): 10 pts, 2nd: 6, 3rd: 5, 4th: 4, 5th: 3, 6th: 2, 7th: 1, 8th: 1, 9th-16th+: 0
export const BGMI_PLACEMENT: Record<number, number> = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
  16: 0,
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
  const eliminationPoints = Math.max(0, kills); // 1 point per kill for both games
  const totalPoints = placementPoints + eliminationPoints;

  return { placementPoints, eliminationPoints, totalPoints };
}

// Check if a placement indicates a win (1st place)
export function isWWCD(placement: number): boolean {
  return placement === 1;
}

// Get the maximum number of teams for a game
export function getMaxTeams(game: GameType): number {
  return game === "FREE_FIRE" ? 12 : 16;
}

// Get the label for 1st place based on game
export function getWinLabel(game: GameType): string {
  return game === "FREE_FIRE" ? "Booyah!" : "WWCD (Chicken Dinner)";
}

// Get human readable scoring table for UI displays
export function getScoringTableDisplay(game: GameType): Array<{ placement: string; points: number }> {
  if (game === "FREE_FIRE") {
    return [
      { placement: "1st (Booyah!)", points: 12 },
      { placement: "2nd", points: 9 },
      { placement: "3rd", points: 8 },
      { placement: "4th", points: 7 },
      { placement: "5th", points: 6 },
      { placement: "6th", points: 5 },
      { placement: "7th", points: 4 },
      { placement: "8th", points: 3 },
      { placement: "9th", points: 2 },
      { placement: "10th", points: 1 },
      { placement: "11th - 12th", points: 0 },
    ];
  }

  return [
    { placement: "1st (WWCD)", points: 10 },
    { placement: "2nd", points: 6 },
    { placement: "3rd", points: 5 },
    { placement: "4th", points: 4 },
    { placement: "5th", points: 3 },
    { placement: "6th", points: 2 },
    { placement: "7th - 8th", points: 1 },
    { placement: "9th - 16th", points: 0 },
  ];
}
