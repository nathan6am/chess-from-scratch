import {
  GameContainer,
  BoardColumn,
  BoardContainer,
  PanelContainer,
} from "@/components/layout/templates/GameLayout";
import { useState } from "react";
import React from "react";
import * as Chess from "@/lib/chess";
import useLocalGame from "@/hooks/useLocalGame";
import Board from "@/components/board/Board";
import useSettings from "@/hooks/useSettings";
export default function LocalGame() {
  const settings = useSettings();
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const { currentGame, currentBoard, lastMove, moveable, onMove } = useLocalGame({
    gameConfig: {},
  });
  return (
    <GameContainer>
      <BoardColumn>
        <BoardContainer>
          <Board
            invertOpposingPieces
            showCoordinates={settings.display.showCoordinates}
            movementType={settings.gameBehavior.movementType}
            theme={settings.display.boardTheme}
            pieceSet={settings.display.pieceTheme}
            orientation={orientation}
            legalMoves={currentGame.legalMoves}
            showHighlights={true}
            showTargets={true}
            pieces={currentBoard || currentGame.board}
            animationSpeed={settings.display.animationSpeed}
            lastMove={lastMove}
            activeColor={currentGame.activeColor}
            moveable={moveable && !currentGame.outcome ? "both" : "none"}
            preMoveable={settings.gameBehavior.allowPremoves}
            autoQueen={settings.gameBehavior.autoQueen}
            onMove={onMove}
            onPremove={() => {}}
          />
        </BoardContainer>
      </BoardColumn>
      <PanelContainer>
        <div>
          <p>Panel</p>
        </div>
      </PanelContainer>
    </GameContainer>
  );
}
