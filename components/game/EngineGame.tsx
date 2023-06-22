import Board from "./Board";
import { useEngineGame } from "@/hooks/useEngineGame";
import * as Chess from "@/lib/chess";
import { SettingsContext } from "@/context/settings";
import { useContext, useState } from "react";
interface Props {
  startPosition?: string;
  preset?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  playerColor?: Chess.Color;
  timeControl?: Chess.TimeControl;
}
export default function EngineGame({ startPosition, preset, playerColor, timeControl }: Props) {
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  const { settings } = useContext(SettingsContext);
  const { currentGame, ready, onMove, clock } = useEngineGame({
    gameConfig: { startPosition },
    preset: preset || 10,
    playerColor,
    timeControl,
  });
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Board
        showCoordinates={settings.display.showCoordinates}
        movementType={settings.gameBehavior.movementType}
        theme={settings.display.boardTheme}
        pieceSet={settings.display.pieceTheme}
        orientation={orientation}
        legalMoves={currentGame.legalMoves}
        showHighlights={true}
        showTargets={true}
        pieces={currentGame.board}
        animationSpeed={settings.display.animationSpeed}
        lastMove={currentGame.lastMove}
        activeColor={currentGame.activeColor}
        moveable={playerColor || "none"}
        preMoveable={settings.gameBehavior.allowPremoves}
        autoQueen={settings.gameBehavior.autoQueen}
        onMove={onMove}
        onPremove={() => {}}
      />
    </div>
  );
}
