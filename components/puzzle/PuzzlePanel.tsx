import React from "react";
import PuzzleFilters from "./PuzzleFilters";
import { ScrollContainer } from "../layout/GameLayout";
export default function PuzzlePanel() {
  return (
    <div className="h-full relative">
      <ScrollContainer>
        <PuzzleFilters />
      </ScrollContainer>
    </div>
  );
}
