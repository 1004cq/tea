/**
 * Curated Unsplash tea imagery (free commercial use under Unsplash License).
 * Prefer real loose-leaf black tea: golden tips, wiry leaves, amber-red liquor.
 * Avoid tea-bag / spice-blend stock shots.
 */

const q = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const siteImages = {
  /** Misty mountain tea plantation — full-bleed hero */
  hero: q("photo-1680535105125-0f719ce3b2c8", 2400),
  /** Amber-red liquor pour — garden to cup */
  story: q("photo-1641997827576-84d0a7e386bc", 1600),
  /** Bamboo trays with fresh + oxidized leaves — origin / craft */
  about: q("photo-1641997828567-e696b7ba3a5e", 1600),
} as const;

export const productImages = {
  /** Dry leaves + amber-red tasting cups — classic Dianhong */
  classic: q("photo-1687178888460-5dcbcd5c8c18", 1400),
  /** Golden tips / pekoe macro — golden needle */
  golden: q("photo-1604697976842-d36fa5a1b2ed", 1400),
  /** Dark wiry oxidized leaves — aged Dianhong */
  aged: q("photo-1713084875210-4167712dde80", 1400),
  /** Loose leaves in clay cup — gift presentation */
  gift: q("photo-1759523710626-199a2da96085", 1400),
  /** Clear amber liquor pour — payment test */
  test: q("photo-1641997827576-84d0a7e386bc", 1200),
} as const;
