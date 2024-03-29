import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/board/Board";
import * as Chess from "@/lib/chess";
export default function GameLocal() {
  const [orientation, setOrientation] = useState<Chess.Color>("w");

  return <div></div>;
}
