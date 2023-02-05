import React from "react";
import * as Chess from "@/lib/chess";
import { Evaler } from "@/hooks/useLocalEval";
interface Props {
  evaler: Evaler;
  currentNodeData?: Chess.NodeData;
}
export default function EvalInfo({ evaler }: Props) {
  return <div className="w-full p-2"></div>;
}
