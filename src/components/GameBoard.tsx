import { Button } from "@base-ui/react/button";
import type { PointerEventHandler, RefObject } from "react";
import { CANVAS_SIZE, type GameStatus } from "../game/constants";

type GameBoardProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onCancelSwipe: () => void;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onStart: () => void;
  score: number;
  status: GameStatus;
};

export function GameBoard({
  canvasRef,
  onCancelSwipe,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onStart,
  score,
  status,
}: GameBoardProps) {
  const overlayCopy = {
    ready: { title: null, text: "Press start, swipe, or use an arrow key." },
    paused: { title: "Paused", text: "Press space or tap resume." },
    dead: { title: "Game over", text: `Score ${score}` },
    won: { title: "You win", text: `Perfect score: ${score}` },
    running: null,
  }[status];

  return (
    <div
      className={`board${status === "dead" ? " board-dead" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onCancelSwipe}
      onLostPointerCapture={onCancelSwipe}
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
            <Button className="button button-primary" onClick={onStart}>
              {status === "dead" || status === "won"
                ? "Play again"
                : status === "paused"
                  ? "Resume"
                  : "Start game"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
