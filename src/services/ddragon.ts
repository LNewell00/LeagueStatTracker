// Riot Data Dragon Service
let currentPatchVersion = "14.24.1";

export async function initDDragonVersion(): Promise<string> {
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    if (res.ok) {
      const versions = await res.json();
      if (Array.isArray(versions) && versions.length > 0) {
        currentPatchVersion = versions[0];
      }
    }
  } catch (err) {
    console.warn("Using fallback Data Dragon patch version", err);
  }
  return currentPatchVersion;
}

export function getDDragonVersion(): string {
  return currentPatchVersion;
}

export function getChampionIconUrl(championName: string): string {
  if (!championName) return "";
  // Fix minor naming anomalies (FiddleSticks -> Fiddlesticks, etc.)
  let formatted = championName.replace(/[^a-zA-Z0-9]/g, "");
  if (formatted.toLowerCase() === "fiddlesticks") formatted = "Fiddlesticks";
  if (formatted.toLowerCase() === "wukong") formatted = "MonkeyKing";
  return `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/img/champion/${formatted}.png`;
}

export function getItemIconUrl(itemId: number): string {
  if (!itemId || itemId === 0) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/img/item/${itemId}.png`;
}

export function getProfileIconUrl(iconId: number = 29): string {
  return `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/img/profileicon/${iconId}.png`;
}

export const SPELL_ID_MAP: Record<number, string> = {
  1: "SummonerBoost", // Cleanse
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste", // Ghost
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  14: "SummonerDot", // Ignite
  21: "SummonerBarrier",
  32: "SummonerSnowball", // Mark (ARAM)
};

export function getSummonerSpellIconUrl(spellId: number): string {
  const spellName = SPELL_ID_MAP[spellId] || "SummonerFlash";
  return `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/img/spell/${spellName}.png`;
}

