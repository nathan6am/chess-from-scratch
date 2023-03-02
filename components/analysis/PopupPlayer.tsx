import React from "react";
import Board from "../game/Board";
import Draggable from "react-draggable";
export default function PopupPlayer() {
  return (
    <div
      style={{
        resize: "vertical",
      }}
      className="aspect-square min-w-[20rem] min-h-[20rem] bg-[#303030] rounded-sm absolute top-20 left-20 shadow-lg z-[50] overflow-hidden"
    >
      PopupPlayer
    </div>
  );
}
