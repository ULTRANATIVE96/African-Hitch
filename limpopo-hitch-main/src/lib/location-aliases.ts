// ── Limpopo & SA Location Slang and Alias Dictionary ──────────────────────────

export interface LocationInfo {
  name: string;
  aliases: string[];
}

export const LIMPOPO_LOCATIONS_DATA: LocationInfo[] = [
  { name: "Polokwane", aliases: ["plk", "pietersburg", "polok", "plkw", "polokwane city"] },
  { name: "Johannesburg", aliases: ["joza", "joburg", "jozi", "jhb", "egoli", "gauteng"] },
  { name: "Pretoria", aliases: ["pta", "tshwane", "p-town", "ptown"] },
  { name: "Tzaneen", aliases: ["tzn", "tzaneen"] },
  { name: "Thohoyandou", aliases: ["thohoyo", "thohoyando", "venda", "2day"] },
  { name: "Mokopane", aliases: ["potgietersrus", "potgieter", "pprus", "potgies"] },
  { name: "Bela-Bela", aliases: ["warmbaths", "warmbad", "bela bela", "belabela"] },
  { name: "Lephalale", aliases: ["ellisras"] },
  { name: "Giyani", aliases: ["g-town", "gtown"] },
  { name: "Makhado (Louis Trichardt)", aliases: ["makhado", "louis trichardt", "ltt", "louis-trichardt"] },
  { name: "Musina", aliases: ["messina"] },
  { name: "Phalaborwa", aliases: ["ba-phalaborwa", "baphalaborwa"] },
  { name: "Thabazimbi", aliases: ["thaba"] },
  { name: "Lebowakgomo", aliases: ["lbg", "lebowakgoma"] },
  { name: "Burgersfort", aliases: ["b-fort", "bfort"] },
  { name: "Lydenburg (Mashishing)", aliases: ["lydenburg", "mashishing"] },
  { name: "Seshego", aliases: ["shego", "sesh"] },
  { name: "Mankweng", aliases: ["turfloop", "turf"] },
  { name: "Modimolle", aliases: ["nylstroom"] },
  { name: "Marble Hall", aliases: ["marblehall"] },
  { name: "Dendron", aliases: ["mogwadi"] },
  { name: "Vuwani", aliases: [] },
  { name: "Elim", aliases: [] },
  { name: "Mutale", aliases: [] },
  { name: "Sibasa", aliases: [] },
  { name: "Malamulele", aliases: ["malam"] },
  { name: "Dzanani", aliases: [] },
  { name: "Bochum", aliases: ["senwabarwana"] },
  { name: "Alldays", aliases: [] },
  { name: "Tshipise", aliases: [] },
  { name: "Roedtan", aliases: [] },
  { name: "Mokgophi", aliases: [] },
  { name: "Ritavi", aliases: [] },
  { name: "Haenertsburg", aliases: [] },
  { name: "Hoedspruit", aliases: [] },
  { name: "Ofcolaco", aliases: [] },
  { name: "Letsitele", aliases: [] },
  { name: "Jane Furse", aliases: ["janefurse"] },
  { name: "Siyabuswa", aliases: [] },
];

export const LIMPOPO_LOCATIONS = LIMPOPO_LOCATIONS_DATA.map((l) => l.name);

// Slang to canonical location dictionary (all lowercase)
export const SLANG_TO_CANONICAL: Record<string, string> = {
  joza: "Johannesburg",
  jozi: "Johannesburg",
  joburg: "Johannesburg",
  jhb: "Johannesburg",
  egoli: "Johannesburg",
  gauteng: "Johannesburg",
  plk: "Polokwane",
  plkw: "Polokwane",
  polok: "Polokwane",
  pietersburg: "Polokwane",
  pta: "Pretoria",
  tshwane: "Pretoria",
  ptown: "Pretoria",
  "p-town": "Pretoria",
  tzn: "Tzaneen",
  thohoyo: "Thohoyandou",
  thohoyando: "Thohoyandou",
  potgietersrus: "Mokopane",
  potgieter: "Mokopane",
  potgies: "Mokopane",
  pprus: "Mokopane",
  warmbaths: "Bela-Bela",
  warmbad: "Bela-Bela",
  "bela bela": "Bela-Bela",
  belabela: "Bela-Bela",
  nylstroom: "Modimolle",
  "louis trichardt": "Makhado (Louis Trichardt)",
  "louis-trichardt": "Makhado (Louis Trichardt)",
  ltt: "Makhado (Louis Trichardt)",
  makhado: "Makhado (Louis Trichardt)",
  ellisras: "Lephalale",
  messina: "Musina",
  turfloop: "Mankweng",
  turf: "Mankweng",
  mogwadi: "Dendron",
  senwabarwana: "Bochum",
  lbg: "Lebowakgomo",
  shego: "Seshego",
  mashishing: "Lydenburg (Mashishing)",
  lydenburg: "Lydenburg (Mashishing)",
};

/**
 * Checks if a location name matches a query string considering canonical name and slang aliases.
 */
export function filterLocationsBySlang(query: string, maxResults = 8): { name: string; matchedAlias?: string }[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return LIMPOPO_LOCATIONS_DATA.slice(0, maxResults).map((l) => ({ name: l.name }));
  }

  const results: { name: string; matchedAlias?: string }[] = [];
  const seen = new Set<string>();

  // 1. Direct prefix or substring match on canonical name
  for (const loc of LIMPOPO_LOCATIONS_DATA) {
    if (loc.name.toLowerCase().includes(trimmed)) {
      results.push({ name: loc.name });
      seen.add(loc.name);
      if (results.length >= maxResults) return results;
    }
  }

  // 2. Exact or partial match on slang aliases
  for (const loc of LIMPOPO_LOCATIONS_DATA) {
    if (seen.has(loc.name)) continue;
    const matchedAlias = loc.aliases.find((alias) => alias.includes(trimmed) || trimmed.includes(alias));
    if (matchedAlias) {
      results.push({ name: loc.name, matchedAlias });
      seen.add(loc.name);
      if (results.length >= maxResults) return results;
    }
  }

  return results;
}

/**
 * Expands search query into token groups where each token has its slang synonyms.
 * E.g., query "plk to joza" produces:
 * [ ["plk", "polokwane", ...], ["joza", "johannesburg", ...] ]
 */
export function expandSearchTokens(rawQuery: string): string[][] {
  const normalized = rawQuery
    .toLowerCase()
    .replace(/[→\->–—]/g, " ")
    .replace(/\b(to|towards|from|dir|via)\b/g, " ")
    .trim();

  const tokens = normalized.split(/\s+/).filter(Boolean);

  return tokens.map((token) => {
    const synonyms = new Set<string>([token]);

    // Check direct slang dictionary match
    const canonical = SLANG_TO_CANONICAL[token];
    if (canonical) {
      synonyms.add(canonical.toLowerCase());
      canonical
        .toLowerCase()
        .split(/[\s()]+/)
        .filter(Boolean)
        .forEach((piece) => synonyms.add(piece));
    }

    // Check prefix slang match (e.g. user typed "joz" or "plk")
    for (const [slang, target] of Object.entries(SLANG_TO_CANONICAL)) {
      if ((slang.startsWith(token) || token.startsWith(slang)) && token.length >= 2) {
        synonyms.add(target.toLowerCase());
        target
          .toLowerCase()
          .split(/[\s()]+/)
          .filter(Boolean)
          .forEach((piece) => synonyms.add(piece));
      }
    }

    // Check location data aliases
    for (const loc of LIMPOPO_LOCATIONS_DATA) {
      if (loc.aliases.some((a) => a === token || a.startsWith(token) || token.startsWith(a))) {
        synonyms.add(loc.name.toLowerCase());
        loc.name
          .toLowerCase()
          .split(/[\s()]+/)
          .filter(Boolean)
          .forEach((piece) => synonyms.add(piece));
      }
    }

    return Array.from(synonyms);
  });
}
