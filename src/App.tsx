import { Button } from "@base-ui/react/button";
import { Select } from "@base-ui/react/select";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type DirectionName = "up" | "right" | "down" | "left";
type GameStatus = "ready" | "running" | "paused" | "dead";
type SwipeStart = Point & { pointerId: number };

const GRID_SIZE = 16;
const CANVAS_SIZE = 768;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;
const PUBLIC_PATH = import.meta.env.BASE_URL;
const MIN_SWIPE_DISTANCE = 16;
const STARTING_SNAKE: Point[] = [
  { x: 7, y: 8 },
  { x: 6, y: 8 },
  { x: 5, y: 8 },
  { x: 4, y: 8 },
];

const DIRECTIONS: Record<DirectionName, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const SPEEDS = [
  { label: "Chill", value: 170 },
  { label: "Normal", value: 125 },
  { label: "Fast", value: 90 },
  { label: "Unhinged", value: 65 },
];

const IMAGE_NAMES = [
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

type ImageName = (typeof IMAGE_NAMES)[number];

function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(a: Point, b: Point) {
  return a.x === -b.x && a.y === -b.y;
}

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function randomFood(snake: Point[]): Point {
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
  head_direction: Point,
): ImageName {
  if (index === 0) {
    // Compare by vector values
    if (
      head_direction.x === DIRECTIONS.up.x &&
      head_direction.y === DIRECTIONS.up.y
    ) {
      return "zhead_up";
    }
    if (
      head_direction.x === DIRECTIONS.right.x &&
      head_direction.y === DIRECTIONS.right.y
    ) {
      return "zhead_left";
    }
    if (
      head_direction.x === DIRECTIONS.down.x &&
      head_direction.y === DIRECTIONS.down.y
    ) {
      return "zhead_down";
    }
    if (
      head_direction.x === DIRECTIONS.left.x &&
      head_direction.y === DIRECTIONS.left.y
    ) {
      return "zhead_right";
    }
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

  const pieces: Record<string, ImageName> = {
    "down,up": "zneck_straight_vertical_plain",
    "left,right": "zneck_straight_horizontal_plain",
    "right,up": "zneck_elbow_up_right_plain",
    "down,right": "zneck_elbow_right_down_plain",
    "down,left": "zneck_elbow_down_left_plain",
    "left,up": "zneck_elbow_left_up_plain",
  };

  return pieces[directions] ?? "zneck_cross_plain";
}

function drawGame(
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

  for (let index = 0; index <= GRID_SIZE; index += 1) {
    context.beginPath();
    context.moveTo(index * TILE_SIZE, 0);
    context.lineTo(index * TILE_SIZE, CANVAS_SIZE);
    context.stroke();

    context.beginPath();
    context.moveTo(0, index * TILE_SIZE);
    context.lineTo(CANVAS_SIZE, index * TILE_SIZE);
    context.stroke();
  }

  const foodX = food.x * TILE_SIZE + TILE_SIZE / 2;
  const foodY = food.y * TILE_SIZE + TILE_SIZE / 2;
  const foodImage = images["zess-plush"];
  const foodSize = TILE_SIZE * 0.86;

  if (foodImage?.complete && foodImage.naturalWidth > 0) {
    const sourceSize = foodImage.naturalWidth * 0.68;
    const sourceX = (foodImage.naturalWidth - sourceSize) / 2;
    const sourceY = foodImage.naturalHeight * 0.04;

    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.45)";
    context.shadowBlur = 4;
    context.shadowOffsetY = 1;
    context.drawImage(
      foodImage,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
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

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>(
    STARTING_SNAKE.map((point) => ({ ...point })),
  );
  const directionRef = useRef<Point>({ ...DIRECTIONS.right });
  const directionQueueRef = useRef<Point[]>([]);
  const foodRef = useRef<Point>(randomFood(STARTING_SNAKE));
  const imagesRef = useRef<Partial<Record<ImageName, HTMLImageElement>>>({});
  const pickupAudioRef = useRef<HTMLAudioElement | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const statusRef = useRef<GameStatus>("ready");
  const scoreRef = useRef(0);

  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() =>
    Number(localStorage.getItem("znakeBest") ?? 0),
  );
  const [speed, setSpeed] = useState(125);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const updateStatus = useCallback((nextStatus: GameStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const playPickupSound = useCallback(() => {
    if (!pickupAudioRef.current) return;

    const sound = pickupAudioRef.current.cloneNode(true) as HTMLAudioElement;
    sound.preservesPitch = false;
    sound.playbackRate = 0.9 + Math.random() * 0.2;
    sound.volume = 0.55;
    void sound.play().catch(() => undefined);
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    drawGame(
      canvasRef.current,
      snakeRef.current,
      foodRef.current,
      imagesRef.current,
      directionRef.current,
    );
  }, []);

  const reset = useCallback(() => {
    snakeRef.current = STARTING_SNAKE.map((point) => ({ ...point }));
    directionRef.current = { ...DIRECTIONS.right };
    directionQueueRef.current = [];
    foodRef.current = randomFood(snakeRef.current);
    scoreRef.current = 0;
    setScore(0);
    updateStatus("ready");
    requestAnimationFrame(draw);
  }, [draw, updateStatus]);

  const start = useCallback(() => {
    if (statusRef.current === "dead") {
      snakeRef.current = STARTING_SNAKE.map((point) => ({ ...point }));
      directionRef.current = { ...DIRECTIONS.right };
      directionQueueRef.current = [];
      foodRef.current = randomFood(snakeRef.current);
      scoreRef.current = 0;
      setScore(0);
    }

    updateStatus("running");
  }, [updateStatus]);

  const restart = useCallback(() => {
    reset();
    updateStatus("running");
  }, [reset, updateStatus]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "dead") return;
    if (statusRef.current === "ready") {
      start();
      return;
    }

    updateStatus(statusRef.current === "paused" ? "running" : "paused");
  }, [start, updateStatus]);

  const setDirection = useCallback(
    (directionName: DirectionName) => {
      const next = DIRECTIONS[directionName];
      const queue = directionQueueRef.current;
      const current = queue.at(-1) ?? directionRef.current;

      if (
        queue.length >= 2 ||
        samePoint(next, current) ||
        isOppositeDirection(next, current)
      ) {
        return;
      }

      queue.push({ ...next });
      vibrate(7);

      if (statusRef.current === "ready") start();
    },
    [start],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest("button")) return;

      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const startPoint = swipeStartRef.current;
      if (!startPoint || startPoint.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - startPoint.x;
      const deltaY = event.clientY - startPoint.y;

      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < MIN_SWIPE_DISTANCE) {
        return;
      }

      swipeStartRef.current = null;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setDirection(deltaX > 0 ? "right" : "left");
      } else {
        setDirection(deltaY > 0 ? "down" : "up");
      }
    },
    [setDirection],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      handlePointerMove(event);
      swipeStartRef.current = null;
    },
    [handlePointerMove],
  );

  const cancelSwipe = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  useEffect(() => {
    const audio = new Audio(`${PUBLIC_PATH}audio/bagels.mp3`);
    audio.preload = "auto";
    pickupAudioRef.current = audio;

    return () => {
      pickupAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let loaded = 0;

    IMAGE_NAMES.forEach((name) => {
      const image = new Image();
      image.onload = image.onerror = () => {
        loaded += 1;
        if (loaded === IMAGE_NAMES.length) setImagesLoaded(true);
      };
      image.src =
        name === "zess-plush"
          ? `${PUBLIC_PATH}assets/zess-plush.webp`
          : `${PUBLIC_PATH}assets/${name}.png`;
      imagesRef.current[name] = image;
    });
  }, []);

  useEffect(() => {
    if (imagesLoaded) draw();
  }, [draw, imagesLoaded]);

  useEffect(() => {
    if (status !== "running") return;

    const timer = window.setInterval(() => {
      const queuedDirection = directionQueueRef.current.shift();
      if (queuedDirection) directionRef.current = queuedDirection;

      const head = snakeRef.current[0];
      const next = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y,
      };

      const hitWall =
        next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE;
      const hitSelf = snakeRef.current.some(
        (point, index) =>
          index !== snakeRef.current.length - 1 && samePoint(point, next),
      );

      if (hitWall || hitSelf) {
        vibrate([35, 25, 55]);
        updateStatus("dead");
        return;
      }

      snakeRef.current.unshift(next);

      if (samePoint(next, foodRef.current)) {
        playPickupSound();
        vibrate(18);
        const nextScore = scoreRef.current + 1;
        scoreRef.current = nextScore;
        setScore(nextScore);
        setBest((currentBest) => {
          if (nextScore <= currentBest) return currentBest;
          localStorage.setItem("znakeBest", String(nextScore));
          return nextScore;
        });
        foodRef.current = randomFood(snakeRef.current);
      } else {
        snakeRef.current.pop();
      }

      draw();
    }, speed);

    return () => window.clearInterval(timer);
  }, [draw, playPickupSound, speed, status, updateStatus]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const keyDirections: Record<string, DirectionName> = {
        arrowup: "up",
        w: "up",
        arrowright: "right",
        d: "right",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
      };

      if (keyDirections[key]) {
        event.preventDefault();
        setDirection(keyDirections[key]);
      } else if (key === " ") {
        event.preventDefault();
        togglePause();
      } else if (key === "r") {
        restart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [restart, setDirection, togglePause]);

  const overlayCopy = {
    ready: { title: null, text: "Press start, swipe, or use an arrow key." },
    paused: { title: "Paused", text: "Press space or tap resume." },
    dead: { title: "Game over", text: `Score ${score}` },
    running: null,
  }[status];

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>znake</h1>
        <div className="scoreboard" aria-label="Game score">
          <div>
            <span>Score</span>
            <strong key={score} className={score > 0 ? "score-pop" : undefined}>
              {score}
            </strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{best}</strong>
          </div>
        </div>
      </header>

      <section className="game-card">
        <div
          className={`board${status === "dead" ? " board-dead" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={cancelSwipe}
          onLostPointerCapture={cancelSwipe}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            aria-label="Snake game board"
          />

          {overlayCopy && (
            <div className="overlay">
              <div className="overlay-content">
                {overlayCopy.title && <h2>{overlayCopy.title}</h2>}
                <p>{overlayCopy.text}</p>
                <Button className="button button-primary" onClick={start}>
                  {status === "dead"
                    ? "Play again"
                    : status === "paused"
                      ? "Resume"
                      : "Start game"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="toolbar">
          <div className="actions">
            <Button className="button" onClick={togglePause}>
              {status === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button className="button" onClick={restart}>
              Restart
            </Button>
          </div>

          <Select.Root
            value={speed}
            onValueChange={(value) => value !== null && setSpeed(value)}
          >
            <Select.Trigger className="select-trigger" aria-label="Game speed">
              <Select.Value>
                {SPEEDS.find((option) => option.value === speed)?.label}
              </Select.Value>
              <Select.Icon className="select-icon">v</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner className="select-positioner" sideOffset={6}>
                <Select.Popup className="select-popup">
                  {SPEEDS.map((option) => (
                    <Select.Item
                      className="select-item"
                      key={option.value}
                      value={option.value}
                    >
                      <Select.ItemIndicator className="select-check">
                        *
                      </Select.ItemIndicator>
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
        </div>

        <div className="mobile-pad" aria-label="Touch controls">
          <span />
          <Button
            className="pad-button"
            aria-label="Move up"
            onPointerDown={() => setDirection("up")}
            onClick={(event) => {
              if (event.detail === 0) setDirection("up");
            }}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <span />
          <Button
            className="pad-button"
            aria-label="Move left"
            onPointerDown={() => setDirection("left")}
            onClick={(event) => {
              if (event.detail === 0) setDirection("left");
            }}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <span className="pad-center" aria-hidden="true" />
          <Button
            className="pad-button"
            aria-label="Move right"
            onPointerDown={() => setDirection("right")}
            onClick={(event) => {
              if (event.detail === 0) setDirection("right");
            }}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
          <span />
          <Button
            className="pad-button"
            aria-label="Move down"
            onPointerDown={() => setDirection("down")}
            onClick={(event) => {
              if (event.detail === 0) setDirection("down");
            }}
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <span />
        </div>
      </section>

      <p className="hint">
        <kbd>Arrows</kbd> or <kbd>WASD</kbd> to move
        <span />
        <kbd>Space</kbd> to pause
      </p>
      <p className="touch-hint">Swipe the board or use the controls</p>
    </main>
  );
}

export default App;
