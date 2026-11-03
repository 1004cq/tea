/**
 * Curated Unsplash tea imagery (free commercial use under Unsplash License).
 * Warm, natural-light, layered look for the Dianhong brand.
 */

const q = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const siteImages = {
  /** Misty mountain tea plantation — full-bleed hero */
  hero: q("photo-1680535105125-0f719ce3b2c8", 2400),
  /** Steam pouring ceremony — brand story */
  story: q("photo-1531969179221-3946e6b5a5e7", 1600),
  /** Tea harvest in terraced garden — about / origin */
  about: q("photo-1743402810466-29a840f2c053", 1600),
} as const;

export const productImages = {
  /** Yunnan black tea cup — classic Dianhong */
  classic: q("photo-1571934811356-5cc061b6821f", 1400),
  /** Amber liquor + clay teapot tray — golden needle */
  golden: q("photo-1577016029703-cc22a7c0c28c", 1400),
  /** Deep red pour ceremony — aged Dianhong */
  aged: q("photo-1548724530-41412fa0e7dc", 1400),
  /** Clay teapot + porcelain cup set — gift */
  gift: q("photo-1548323164-ea1cb76539e8", 1400),
  /** Clean cup top-down — payment test */
  test: q("photo-1550450339-e7a4787a2074", 1200),
} as const;
