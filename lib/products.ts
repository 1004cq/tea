/**
 * Product catalog for the tea shop.
 * `price` is PayPal checkout currency (default USD).
 * `priceCny` is the Alipay charge in yuan — set independently, not 1:1 with USD.
 */

import { productImages } from "@/lib/images";

export type ProductCategory = "daily" | "tasting" | "gift" | "test";

export type TestProvider = "paypal" | "alipay";

export type Product = {
  id: string;
  name: string;
  nameEn: string;
  /** PayPal / USD catalog amount */
  price: number;
  /** Alipay catalog amount in CNY */
  priceCny: number;
  description: string;
  descriptionEn: string;
  longDescription: string;
  image: string;
  weight: string;
  grade: string;
  category: ProductCategory;
  /** Which checkout a smoke-test SKU is meant for */
  testProvider?: TestProvider;
  origin: string;
  originEn: string;
  craft: string;
  craftEn: string;
  taste: string;
  tasteEn: string;
};

export const categoryLabels: Record<
  Exclude<ProductCategory, "test">,
  { zh: string; en: string }
> = {
  daily: { zh: "日常品饮", en: "Daily" },
  tasting: { zh: "静心品鉴", en: "Tasting" },
  gift: { zh: "礼赠", en: "Gift" },
};

export const products: Product[] = [
  {
    id: "paypal-test-cent",
    name: "PayPal 测试（1美分）",
    nameEn: "PayPal Test (USD 0.01)",
    price: 0.01,
    priceCny: 0.01,
    description: "仅用于 PayPal 最低金额联调，非正式售卖商品。",
    descriptionEn: "PayPal smoke test only — not for sale.",
    longDescription:
      "此商品仅用于以 USD 0.01 验证 PayPal 下单与收款。请用 PayPal 按钮；勿用于正式茶叶售卖。",
    image: productImages.test,
    weight: "—",
    grade: "测试",
    category: "test",
    testProvider: "paypal",
    origin: "—",
    originEn: "—",
    craft: "—",
    craftEn: "—",
    taste: "—",
    tasteEn: "—",
  },
  {
    id: "alipay-test-fen",
    name: "支付宝测试（1分人民币）",
    nameEn: "Alipay Test (CNY 0.01)",
    price: 0.01,
    priceCny: 0.01,
    description: "仅用于支付宝最低金额联调，非正式售卖商品。",
    descriptionEn: "Alipay smoke test only — not for sale.",
    longDescription:
      "此商品仅用于以 ¥0.01 验证支付宝下单与回调。请用支付宝按钮；勿用于正式茶叶售卖。",
    image: productImages.test,
    weight: "—",
    grade: "测试",
    category: "test",
    testProvider: "alipay",
    origin: "—",
    originEn: "—",
    craft: "—",
    craftEn: "—",
    taste: "—",
    tasteEn: "—",
  },
  {
    id: "dianhong-classic",
    name: "经典滇红",
    nameEn: "Classic Dianhong",
    price: 28,
    priceCny: 198,
    description: "凤庆高山红茶，汤色红亮，蜜香甘醇，日常品饮首选。",
    descriptionEn:
      "Highland Yunnan black tea with bright liquor and honeyed sweetness — everyday cup.",
    longDescription:
      "精选凤庆海拔 1800 米高山一芽二叶，传统工夫红茶工艺精制而成。汤色红艳明亮，蜜香与花果香交织，入口甜润回甘，适合日常冲泡与礼赠。",
    image: productImages.classic,
    weight: "100g",
    grade: "特级",
    category: "daily",
    origin: "云南凤庆 · 海拔约 1800m",
    originEn: "Fengqing, Yunnan · ~1,800m",
    craft: "工夫红茶 · 一芽二叶",
    craftEn: "Gongfu black · bud + two leaves",
    taste: "蜜香 · 花果 · 甜润回甘",
    tasteEn: "Honey, floral-fruit, sweet finish",
  },
  {
    id: "golden-needle",
    name: "金芽滇红",
    nameEn: "Golden Needle",
    price: 48,
    priceCny: 338,
    description: "全芽精制，金毫显露，蜜香浓郁，适合静心品鉴。",
    descriptionEn:
      "Single-bud pick with golden tips and lifted honey aroma — for slow tasting.",
    longDescription:
      "仅取早春肥壮单芽，金毫满披，条索紧直。冲泡后金毫浮沉，香气蜜香高扬，汤感醇厚绵长，是滇红中的高端品鉴款。",
    image: productImages.golden,
    weight: "80g",
    grade: "珍藏",
    category: "tasting",
    origin: "云南凤庆 · 早春单芽",
    originEn: "Fengqing, Yunnan · early-spring buds",
    craft: "全芽精制 · 金毫显露",
    craftEn: "Whole-bud craft · golden tips",
    taste: "高扬蜜香 · 醇厚绵长",
    tasteEn: "High honey note · rich body",
  },
  {
    id: "aged-dianhong",
    name: "陈韵滇红",
    nameEn: "Aged Dianhong",
    price: 68,
    priceCny: 478,
    description: "窖藏三年，陈香温润，汤感厚实，适合慢饮收藏。",
    descriptionEn:
      "Three-year cellar aging for a warmer, deeper cup — slow sipping and keeping.",
    longDescription:
      "精选优质滇红成品，经三年适度陈化，锐利蜜香转为温润陈香。汤色更深，口感更醇，暖胃养气，适合秋冬慢饮与收藏。",
    image: productImages.aged,
    weight: "100g",
    grade: "窖藏",
    category: "tasting",
    origin: "云南凤庆 · 窖藏陈化",
    originEn: "Fengqing, Yunnan · cellar-aged",
    craft: "三年适度陈化",
    craftEn: "Three years gentle aging",
    taste: "陈香温润 · 汤感厚实",
    tasteEn: "Mellow aged note · dense liquor",
  },
  {
    id: "gift-set",
    name: "凤庆礼盒",
    nameEn: "Fengqing Gift Set",
    price: 98,
    priceCny: 688,
    description: "经典与金芽双拼礼盒，礼赠自饮两相宜。",
    descriptionEn:
      "Classic + Golden Needle duo — ready for gifting or shared tasting.",
    longDescription:
      "礼盒含经典滇红 100g 与金芽滇红 50g，配以素雅茶具指南卡。适合节日礼赠、商务往来，或作为入门滇红的完整体验。",
    image: productImages.gift,
    weight: "150g",
    grade: "礼盒",
    category: "gift",
    origin: "云南凤庆双拼",
    originEn: "Fengqing duo selection",
    craft: "经典 100g + 金芽 50g",
    craftEn: "Classic 100g + Golden Needle 50g",
    taste: "蜜香与金毫并陈",
    tasteEn: "Honeyed and tippy profiles together",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getCatalogProducts(): Product[] {
  return products.filter((p) => p.category !== "test");
}
