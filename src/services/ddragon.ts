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
  // Preload items dictionary in the background
  fetchAllItems().catch(() => {});
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

export interface ItemInfo {
  id: number;
  name: string;
  plaintext?: string;
  description: string;
  gold?: { total: number; sell: number; purchasable: boolean };
}

let itemsCache: Record<string, ItemInfo> | null = null;
let isFetchingItems = false;
const itemFetchListeners: ((items: Record<string, ItemInfo>) => void)[] = [];

export async function fetchAllItems(): Promise<Record<string, ItemInfo>> {
  if (itemsCache) return itemsCache;

  if (isFetchingItems) {
    return new Promise((resolve) => {
      itemFetchListeners.push(resolve);
    });
  }

  isFetchingItems = true;
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/data/en_US/item.json`
    );
    if (res.ok) {
      const data = await res.json();
      const items: Record<string, ItemInfo> = {};
      if (data.data) {
        Object.keys(data.data).forEach((id) => {
          const item = data.data[id];
          items[id] = {
            id: Number(id),
            name: item.name,
            plaintext: item.plaintext,
            description: item.description,
            gold: item.gold,
          };
        });
      }
      itemsCache = items;
      itemFetchListeners.forEach((l) => l(items));
      itemFetchListeners.length = 0;
      return items;
    }
  } catch (e) {
    console.warn("Failed to fetch items data from DataDragon", e);
  } finally {
    isFetchingItems = false;
  }
  return {};
}

export function getItemDataSync(itemId: number): ItemInfo | null {
  if (!itemsCache || !itemId) return null;
  return itemsCache[String(itemId)] || null;
}

export function formatItemDescription(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<rules>.*?<\/rules>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export interface ChampionBasicInfo {
  id: string;
  name: string;
  title: string;
  tags: string[];
}

let championsCache: ChampionBasicInfo[] | null = null;

export async function fetchAllChampions(): Promise<ChampionBasicInfo[]> {
  if (championsCache) return championsCache;
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${currentPatchVersion}/data/en_US/champion.json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        championsCache = Object.values(data.data)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            title: c.title,
            tags: c.tags || [],
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return championsCache;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch champions from DataDragon", err);
  }
  return [];
}

