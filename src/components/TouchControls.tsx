import { Button } from "@base-ui/react/button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { DirectionName } from "../game/constants";

type TouchControlsProps = {
  onDirection: (direction: DirectionName) => void;
};

export function TouchControls({ onDirection }: TouchControlsProps) {
  const inputProps = (direction: DirectionName) => ({
    onPointerDown: () => onDirection(direction),
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) onDirection(direction);
    },
  });

  return (
    <div className="mobile-pad" aria-label="Touch controls">
      <span />
      <Button
        className="pad-button"
        aria-label="Move up"
        {...inputProps("up")}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <span />
      <Button
        className="pad-button"
        aria-label="Move left"
        {...inputProps("left")}
      >
        <ArrowLeft aria-hidden="true" />
      </Button>
      <span className="pad-center" aria-hidden="true" />
      <Button
        className="pad-button"
        aria-label="Move right"
        {...inputProps("right")}
      >
        <ArrowRight aria-hidden="true" />
      </Button>
      <span />
      <Button
        className="pad-button"
        aria-label="Move down"
        {...inputProps("down")}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      <span />
    </div>
  );
}
