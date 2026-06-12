import { Button } from "@base-ui/react/button";
import { Select } from "@base-ui/react/select";
import { GameBoard } from "./components/GameBoard";
import { TouchControls } from "./components/TouchControls";
import { SPEEDS } from "./game/constants";
import { useSnakeGame } from "./hooks/useSnakeGame";

function App() {
  const game = useSnakeGame();

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>znake</h1>
        <div className="scoreboard" aria-label="Game score">
          <div>
            <span>Score</span>
            <strong
              key={game.score}
              className={game.score > 0 ? "score-pop" : undefined}
            >
              {game.score}
            </strong>
          </div>
          <div>
            <span>Best</span>
            <strong>{game.best}</strong>
          </div>
        </div>
      </header>

      <section className="game-card">
        <GameBoard
          canvasRef={game.canvasRef}
          onCancelSwipe={game.cancelSwipe}
          onPointerDown={game.handlePointerDown}
          onPointerMove={game.handlePointerMove}
          onPointerUp={game.handlePointerUp}
          onStart={game.start}
          score={game.score}
          status={game.status}
        />

        <div className="toolbar">
          <div className="actions">
            <Button className="button" onClick={game.togglePause}>
              {game.status === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button className="button" onClick={game.restart}>
              Restart
            </Button>
          </div>

          <Select.Root
            value={game.speed}
            onValueChange={(value) => value !== null && game.setSpeed(value)}
          >
            <Select.Trigger className="select-trigger" aria-label="Game speed">
              <Select.Value>
                {SPEEDS.find((option) => option.value === game.speed)?.label}
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

        <TouchControls onDirection={game.setDirection} />
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
