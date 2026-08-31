/**
 * Tiers sit on a 0 baseline: Cyber Rating is what you earned, not a starting endowment, so a new
 * learner is Bronze at 0 rather than Silver at 1200. A solve is worth 13-41 depending on difficulty.
 */
export function rankFromRating(rating: number) {
  if (rating >= 1900) return "Elite";
  if (rating >= 1200) return "Diamond";
  if (rating >= 700) return "Platinum";
  if (rating >= 300) return "Gold";
  if (rating >= 100) return "Silver";
  return "Bronze";
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1);
}
