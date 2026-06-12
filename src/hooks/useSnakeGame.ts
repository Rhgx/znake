import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  DIRECTIONS,
  IMAGE_NAMES,
  MIN_SWIPE_DISTANCE,
  PUBLIC_PATH,
  STARTING_SNAKE,
  type DirectionName,
  type GameStatus,
  type ImageName,
  type Point,
  type SwipeStart,
} from "../game/constants";
import { drawGame } from "../game/drawing";
import {
  advanceSnake,
  queueDirection,
  randomFood,
} from "../game/logic";

function vibrate(pattern: number | number[]) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

export function useSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>(
    STARTING_SNAKE.map((point) => ({ ...point })),
  );
  const directionRef = useRef<Point>({ ...DIRECTIONS.right });
  const directionQueueRef = useRef<Point[]>([]);
  const foodRef = useRef<Point | null>(randomFood(STARTING_SNAKE));
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

  const resetGameState = useCallback(() => {
    snakeRef.current = STARTING_SNAKE.map((point) => ({ ...point }));
    directionRef.current = { ...DIRECTIONS.right };
    directionQueueRef.current = [];
    foodRef.current = randomFood(snakeRef.current);
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const reset = useCallback(() => {
    resetGameState();
    updateStatus("ready");
    requestAnimationFrame(draw);
  }, [draw, resetGameState, updateStatus]);

  const start = useCallback(() => {
    if (statusRef.current === "dead" || statusRef.current === "won") {
      resetGameState();
    }
    updateStatus("running");
  }, [resetGameState, updateStatus]);

  const restart = useCallback(() => {
    reset();
    updateStatus("running");
  }, [reset, updateStatus]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "dead" || statusRef.current === "won") return;
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
      const nextQueue = queueDirection(directionRef.current, queue, next);
      if (nextQueue === queue) return;

      directionQueueRef.current = nextQueue;
      vibrate(7);

      if (statusRef.current === "ready") start();
    },
    [start],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    (event: ReactPointerEvent<HTMLDivElement>) => {
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

      const food = foodRef.current;
      if (!food) {
        updateStatus("won");
        return;
      }

      const result = advanceSnake(
        snakeRef.current,
        directionRef.current,
        food,
      );

      if (result.outcome === "dead") {
        vibrate([35, 25, 55]);
        updateStatus("dead");
        return;
      }

      snakeRef.current = result.snake;
      foodRef.current = result.food;

      if (result.ateFood) {
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
      }

      draw();

      if (result.outcome === "won") {
        updateStatus("won");
      }
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

  return {
    best,
    cancelSwipe,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    restart,
    score,
    setDirection,
    setSpeed,
    speed,
    start,
    status,
    togglePause,
  };
}
