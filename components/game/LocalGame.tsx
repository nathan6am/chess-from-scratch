import { GameContainer, BoardColumn, BoardContainer, PanelContainer } from "@/components/layout/templates/GameLayout";

import React from "react";

export default function LocalGame() {
  return (
    <GameContainer>
      <BoardColumn>
        <BoardContainer>
          <div>
            <p>Board</p>
          </div>
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
