import { describe, expect, it } from "vitest";
import { DIRECTIONS, GRID_SIZE, type Point } from "./constants";
import {
  advanceSnake,
  queueDirection,
  randomFood,
  samePoint,
} from "./logic";

describe("randomFood", () => {
  it("returns null when the snake fills the board", () => {
    const snake = Array.from(
      { length: GRID_SIZE * GRID_SIZE },
      (_, index) => ({
        x: index % GRID_SIZE,
        y: Math.floor(index / GRID_SIZE),
      }),
    );

    expect(randomFood(snake)).toBeNull();
  });

  it("places food on the only available tile", () => {
    const gap = { x: 3, y: 7 };
    const snake = Array.from(
      { length: GRID_SIZE * GRID_SIZE },
      (_, index) => ({
        x: index % GRID_SIZE,
        y: Math.floor(index / GRID_SIZE),
      }),
    ).filter((point) => !samePoint(point, gap));

    expect(randomFood(snake, () => 0.75)).toEqual(gap);
  });
});

describe("queueDirection", () => {
  it("queues up to two legal turns", () => {
    const firstTurn = queueDirection(
      DIRECTIONS.right,
      [],
      DIRECTIONS.up,
    );
    const secondTurn = queueDirection(
      DIRECTIONS.right,
      firstTurn,
      DIRECTIONS.left,
    );

    expect(secondTurn).toEqual([DIRECTIONS.up, DIRECTIONS.left]);
  });

  it("rejects duplicate, opposite, and excess turns", () => {
    const queue = [DIRECTIONS.up];

    expect(queueDirection(DIRECTIONS.right, queue, DIRECTIONS.up)).toBe(queue);
    expect(queueDirection(DIRECTIONS.right, queue, DIRECTIONS.down)).toBe(
      queue,
    );

    const fullQueue = [DIRECTIONS.up, DIRECTIONS.left];
    expect(
      queueDirection(DIRECTIONS.right, fullQueue, DIRECTIONS.down),
    ).toBe(fullQueue);
  });
});

describe("advanceSnake", () => {
  const snake: Point[] = [
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
  ];

  it("moves without growing when no food is collected", () => {
    const result = advanceSnake(snake, DIRECTIONS.right, { x: 8, y: 8 });

    expect(result).toMatchObject({
      ateFood: false,
      outcome: "running",
      snake: [
        { x: 4, y: 2 },
        { x: 3, y: 2 },
        { x: 2, y: 2 },
      ],
    });
  });

  it("grows and creates new food after a pickup", () => {
    const nextFood = { x: 9, y: 9 };
    const result = advanceSnake(
      snake,
      DIRECTIONS.right,
      { x: 4, y: 2 },
      () => nextFood,
    );

    expect(result.ateFood).toBe(true);
    expect(result.food).toBe(nextFood);
    expect(result.snake).toHaveLength(snake.length + 1);
    expect(result.outcome).toBe("running");
  });

  it("wins when the final free tile is collected", () => {
    const result = advanceSnake(
      snake,
      DIRECTIONS.right,
      { x: 4, y: 2 },
      () => null,
    );

    expect(result).toMatchObject({
      ateFood: true,
      food: null,
      outcome: "won",
    });
  });

  it("detects wall and self collisions", () => {
    const wallResult = advanceSnake(
      [{ x: GRID_SIZE - 1, y: 0 }],
      DIRECTIONS.right,
      { x: 0, y: 0 },
    );
    const selfResult = advanceSnake(
      [
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 },
      ],
      DIRECTIONS.down,
      { x: 8, y: 8 },
    );

    expect(wallResult.outcome).toBe("dead");
    expect(selfResult.outcome).toBe("dead");
  });
});
