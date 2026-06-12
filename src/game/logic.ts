import { GRID_SIZE, type Point } from "./constants";

export type StepOutcome = "running" | "dead" | "won";

export type StepResult = {
  ateFood: boolean;
  food: Point | null;
  outcome: StepOutcome;
  snake: Point[];
};

export function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function isOppositeDirection(a: Point, b: Point) {
  return a.x === -b.x && a.y === -b.y;
}

export function randomFood(snake: Point[], random = Math.random): Point | null {
  const occupied = new Set(snake.map((point) => `${point.x},${point.y}`));
  const available: Point[] = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y });
    }
  }

  if (available.length === 0) return null;
  return available[Math.floor(random() * available.length)];
}

export function queueDirection(
  currentDirection: Point,
  queue: Point[],
  nextDirection: Point,
): Point[] {
  const latestDirection = queue.at(-1) ?? currentDirection;

  if (
    queue.length >= 2 ||
    samePoint(nextDirection, latestDirection) ||
    isOppositeDirection(nextDirection, latestDirection)
  ) {
    return queue;
  }

  return [...queue, { ...nextDirection }];
}

export function advanceSnake(
  snake: Point[],
  direction: Point,
  food: Point,
  createFood: (nextSnake: Point[]) => Point | null = randomFood,
): StepResult {
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= GRID_SIZE ||
    nextHead.y < 0 ||
    nextHead.y >= GRID_SIZE;
  const hitSelf = snake.some(
    (point, index) =>
      index !== snake.length - 1 && samePoint(point, nextHead),
  );

  if (hitWall || hitSelf) {
    return {
      ateFood: false,
      food,
      outcome: "dead",
      snake,
    };
  }

  const ateFood = samePoint(nextHead, food);
  const nextSnake = ateFood
    ? [nextHead, ...snake]
    : [nextHead, ...snake.slice(0, -1)];

  if (!ateFood) {
    return {
      ateFood: false,
      food,
      outcome: "running",
      snake: nextSnake,
    };
  }

  const nextFood = createFood(nextSnake);

  return {
    ateFood: true,
    food: nextFood,
    outcome: nextFood ? "running" : "won",
    snake: nextSnake,
  };
}
