import { Duck } from "@/lib/stores/useDuckRace";

// Duck colors based on the required theme colors and some fun variations
const DUCK_COLORS = [
  "#FFD700", // Primary Yellow
  "#4CAF50", // Secondary Green
  "#3498DB", // Water Blue
  "#FF6B6B", // Accent Red
  "#FFA500", // Orange
  "#9B59B6", // Purple
];

// Default set of ducks to start with
export const DEFAULT_DUCKS: Duck[] = [
  {
    id: 1001, // Use high numbers to avoid collisions with dynamically created IDs
    name: "Vịt Vàng",
    color: DUCK_COLORS[0],
    position: 0,
    lane: 0,
    isWinner: false,
  },
  {
    id: 1002,
    name: "Vịt Xanh",
    color: DUCK_COLORS[1],
    position: 0,
    lane: 1,
    isWinner: false,
  },
  {
    id: 1003,
    name: "Vịt Nước",
    color: DUCK_COLORS[2],
    position: 0,
    lane: 2,
    isWinner: false,
  },
  {
    id: 1004,
    name: "Vịt Đỏ",
    color: DUCK_COLORS[3],
    position: 0,
    lane: 3,
    isWinner: false,
  },
];

// Very simple duck shape like in the reference image
export const DUCK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g>
    <ellipse cx="50" cy="50" rx="30" ry="25" fill="currentColor" />
    <circle cx="80" cy="50" r="12" fill="currentColor" />
    <circle cx="85" cy="47" r="3" fill="black" />
    <path d="M92,48 L100,47 L92,52 Z" fill="orange" />
    <path class="left-foot" d="M30,75 L25,85 L35,85 Z" fill="orange" />
    <path class="right-foot" d="M60,75 L55,85 L65,85 Z" fill="orange" />
  </g>
</svg>
`;

// Finish line SVG
export const FINISH_LINE_SVG = `
<svg viewBox="0 0 100 300" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="0" y="0" width="100" height="300" fill="#FF6B6B" />
    <text x="50" y="150" font-size="14" text-anchor="middle" transform="rotate(90, 50, 150)" fill="white" font-weight="bold">FINISH LINE</text>
    <rect x="10" y="0" width="10" height="300" fill="white" />
    <rect x="30" y="0" width="10" height="300" fill="white" />
    <rect x="50" y="0" width="10" height="300" fill="white" />
    <rect x="70" y="0" width="10" height="300" fill="white" />
    <rect x="90" y="0" width="10" height="300" fill="white" />
  </g>
</svg>
`;
