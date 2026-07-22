export type Product = {
  name: string;
  price: number;
  compareAt?: number;
  soldOut?: boolean;
  tag?: string;
  /** two-stop fabric tone for the lookbook placeholder */
  tone: [string, string];
};

// Placeholder tones read as fabric swatches until real photography lands.
export const editorsEdit: Product[] = [
  { name: "Ottoline Silk Slip", price: 220, compareAt: 340, tag: "New", tone: ["#e7d3c7", "#c9a99a"] },
  { name: "Empress Wool Coat", price: 480, tone: ["#c9c0b3", "#8f8577"] },
  { name: "Halcyon Pleated Skirt", price: 190, soldOut: true, tone: ["#d8cbe0", "#b3a0c4"] },
  { name: "Verona Cashmere Knit", price: 260, compareAt: 320, tone: ["#e9ddc9", "#cbb489"] },
];

export const seasonEdit: Product[] = [
  { name: "Solene Linen Dress", price: 230, compareAt: 300, tone: ["#eee3d2", "#d3bd9a"] },
  { name: "Marlowe Poplin Shirt", price: 140, tone: ["#e4e6e1", "#b6bcae"] },
  { name: "Aria Bias Gown", price: 390, tag: "Runway", tone: ["#dcc7c9", "#b0888c"] },
  { name: "Celeste Pearl Drops", price: 120, compareAt: 180, tone: ["#efe7da", "#d2c3a6"] },
];

export type Category = { name: string; blurb: string; tone: [string, string] };
export const categories: Category[] = [
  { name: "Outerwear", blurb: "Structured, sculptural, forever", tone: ["#c9c0b3", "#8f8577"] },
  { name: "Dresses", blurb: "From daylight to candlelight", tone: ["#e2cfd0", "#b58f92"] },
  { name: "Knitwear", blurb: "Cashmere-soft, quietly rich", tone: ["#e9ddc9", "#c8b088"] },
  { name: "Atelier", blurb: "Fine jewellery & accessories", tone: ["#d9cfe0", "#ad9bc0"] },
];
