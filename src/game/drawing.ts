import {
  CANVAS_SIZE,
  DIRECTIONS,
  GRID_SIZE,
  TILE_SIZE,
  type DirectionName,
  type ImageName,
  type Point,
} from "./constants";

const SEGMENT_IMAGES: Record<string, ImageName> = {
  "down,up": "zneck_straight_vertical_plain",
  "left,right": "zneck_straight_horizontal_plain",
  "right,up": "zneck_elbow_up_right_plain",
  "down,right": "zneck_elbow_right_down_plain",
  "down,left": "zneck_elbow_down_left_plain",
  "left,up": "zneck_elbow_left_up_plain",
};

export function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function isOppositeDirection(a: Point, b: Point) {
  return a.x === -b.x && a.y === -b.y;
}

export function randomFood(snake: Point[]): Point {
  let food: Point;

  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((point) => samePoint(point, food)));

  return food;
}

function directionFromTo(a: Point, b: Point): DirectionName | "" {
  if (b.x > a.x) return "right";
  if (b.x < a.x) return "left";
  if (b.y > a.y) return "down";
  if (b.y < a.y) return "up";
  return "";
}

function pieceForSegment(
  snake: Point[],
  index: number,
  headDirection: Point,
): ImageName {
  if (index === 0) {
    if (samePoint(headDirection, DIRECTIONS.up)) return "zhead_up";
    if (samePoint(headDirection, DIRECTIONS.right)) return "zhead_left";
    if (samePoint(headDirection, DIRECTIONS.down)) return "zhead_down";
    if (samePoint(headDirection, DIRECTIONS.left)) return "zhead_right";
  }

  const current = snake[index];
  const previous = snake[index - 1];

  if (index === snake.length - 1) {
    const direction = directionFromTo(current, previous);
    return `zneck_cap_${direction}_plain` as ImageName;
  }

  const next = snake[index + 1];
  const directions = [
    directionFromTo(current, previous),
    directionFromTo(current, next),
  ]
    .sort()
    .join(",");

  return SEGMENT_IMAGES[directions] ?? "zneck_cross_plain";
}

export function drawGame(
  canvas: HTMLCanvasElement,
  snake: Point[],
  food: Point,
  images: Partial<Record<ImageName, HTMLImageElement>>,
  direction: Point = DIRECTIONS.right,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.strokeStyle = "rgba(255, 255, 255, 0.055)";
  context.lineWidth = 1;
  context.beginPath();

  for (let index = 0; index <= GRID_SIZE; index += 1) {
    context.moveTo(index * TILE_SIZE, 0);
    context.lineTo(index * TILE_SIZE, CANVAS_SIZE);
    context.moveTo(0, index * TILE_SIZE);
    context.lineTo(CANVAS_SIZE, index * TILE_SIZE);
  }
  context.stroke();

  const foodX = food.x * TILE_SIZE + TILE_SIZE / 2;
  const foodY = food.y * TILE_SIZE + TILE_SIZE / 2;
  const foodImage = images["zess-plush"];
  const foodSize = TILE_SIZE * 0.86;

  if (foodImage?.complete && foodImage.naturalWidth > 0) {
    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.45)";
    context.shadowBlur = 4;
    context.shadowOffsetY = 1;
    context.drawImage(
      foodImage,
      foodX - foodSize / 2,
      foodY - foodSize / 2,
      foodSize,
      foodSize,
    );
    context.restore();
  } else {
    context.fillStyle = "#d85f2d";
    context.beginPath();
    context.arc(foodX, foodY, TILE_SIZE * 0.22, 0, Math.PI * 2);
    context.fill();
  }

  for (let index = snake.length - 1; index >= 0; index -= 1) {
    const point = snake[index];
    const image = images[pieceForSegment(snake, index, direction)];

    if (image?.complete && image.naturalWidth > 0) {
      context.drawImage(
        image,
        point.x * TILE_SIZE,
        point.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      );
    } else {
      context.fillStyle = index === 0 ? "#eea8a1" : "#f9d8d4";
      context.fillRect(
        point.x * TILE_SIZE + 2,
        point.y * TILE_SIZE + 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
      );
    }
  }
}
