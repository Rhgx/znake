export type Point = { x: number; y: number };
export type DirectionName = "up" | "right" | "down" | "left";
export type GameStatus = "ready" | "running" | "paused" | "dead" | "won";
export type SwipeStart = Point & { pointerId: number };

export const GRID_SIZE = 16;
export const CANVAS_SIZE = 768;
export const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;
export const PUBLIC_PATH = import.meta.env.BASE_URL;
export const MIN_SWIPE_DISTANCE = 16;

export const STARTING_SNAKE: Point[] = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
  { x: 4, y: 8 },
];

export const DIRECTIONS: Record<DirectionName, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export const SPEEDS = [
  { label: "Chill", value: 170 },
  { label: "Normal", value: 125 },
  { label: "Fast", value: 90 },
  { label: "Unhinged", value: 65 },
];

export const IMAGE_NAMES = [
  "zhead_up",
  "zhead_right",
  "zhead_down",
  "zhead_left",
  "zess-plush",
  "zneck_straight_vertical_plain",
  "zneck_straight_horizontal_plain",
  "zneck_elbow_up_right_plain",
  "zneck_elbow_right_down_plain",
  "zneck_elbow_down_left_plain",
  "zneck_elbow_left_up_plain",
  "zneck_cap_up_plain",
  "zneck_cap_right_plain",
  "zneck_cap_down_plain",
  "zneck_cap_left_plain",
] as const;

export type ImageName = (typeof IMAGE_NAMES)[number];
