/**
 * Product catalog for the tea shop.
 * Prices are in the configured checkout currency (default USD).
 */

export type Product = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  description: string;
  longDescription: string;
  image: string;
  weight: string;
  grade: string;
};

export const products: Product[] = [
  {
    id: "paypal-test-cent",
    name: "支付测试（1美分）",
    nameEn: "Payment Test (1¢)",
    price: 0.01,
    description: "用于 PayPal / 支付宝最低金额联调，非正式售卖商品。",
    longDescription:
      "此商品仅用于验证支付链路能否以最低金额（0.01 USD / ¥0.01）完成下单与收款。请勿作为正式茶叶商品售卖。",
    image:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1200&q=80",
    weight: "—",
    grade: "测试",
  },
  {
    id: "dianhong-classic",
    name: "经典滇红",
    nameEn: "Classic Dianhong",
    price: 28,
    description: "凤庆高山红茶，汤色红亮，蜜香甘醇，日常品饮首选。",
    longDescription:
      "精选凤庆海拔 1800 米高山一芽二叶，传统工夫红茶工艺精制而成。汤色红艳明亮，蜜香与花果香交织，入口甜润回甘，适合日常冲泡与礼赠。",
    image:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=1200&q=80",
    weight: "100g",
    grade: "特级",
  },
  {
    id: "golden-needle",
    name: "金芽滇红",
    nameEn: "Golden Needle",
    price: 48,
    description: "全芽精制，金毫显露，蜜香浓郁，适合静心品鉴。",
    longDescription:
      "仅取早春肥壮单芽，金毫满披，条索紧直。冲泡后金毫浮沉，香气蜜香高扬，汤感醇厚绵长，是滇红中的高端品鉴款。",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80",
    weight: "80g",
    grade: "珍藏",
  },
  {
    id: "aged-dianhong",
    name: "陈韵滇红",
    nameEn: "Aged Dianhong",
    price: 68,
    description: "窖藏三年，陈香温润，汤感厚实，适合慢饮收藏。",
    longDescription:
      "精选优质滇红成品，经三年适度陈化，锐利蜜香转为温润陈香。汤色更深，口感更醇，暖胃养气，适合秋冬慢饮与收藏。",
    image:
      "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=1200&q=80",
    weight: "100g",
    grade: "窖藏",
  },
  {
    id: "gift-set",
    name: "凤庆礼盒",
    nameEn: "Fengqing Gift Set",
    price: 98,
    description: "经典与金芽双拼礼盒，礼赠自饮两相宜。",
    longDescription:
      "礼盒含经典滇红 100g 与金芽滇红 50g，配以素雅茶具指南卡。适合节日礼赠、商务往来，或作为入门滇红的完整体验。",
    image:
      "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?auto=format&fit=crop&w=1200&q=80",
    weight: "150g",
    grade: "礼盒",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
