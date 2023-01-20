import React from "react";
export interface AppSettings {
  gameBehavior: {
    movementType: "click" | "drag" | "both";
    autoQueen: boolean;
    allowPremoves: boolean;
  };
  display: {
    animationSpeed: "slow" | "normal" | "fast" | "disabled";
    showHighlights: boolean;
    showValidMoves: boolean;
    showCoordinates: "inside" | "outside" | "hidden";
    showCapturedMaterial: boolean;
    boardTheme: "standard" | "alternate" | "custom";
    pieceTheme: "standard" | "alternate";
  };
  sound: {
    volume: number;
    lowTimeWarning: boolean;
  };

  UITheme: "light" | "dark";
}

export const defaultSettings: AppSettings = {
  gameBehavior: {
    movementType: "both",
    autoQueen: false,
    allowPremoves: true,
  },
  display: {
    animationSpeed: "normal",
    showHighlights: true,
    showValidMoves: true,
    showCoordinates: "inside",
    showCapturedMaterial: true,
    boardTheme: "standard",
    pieceTheme: "standard",
  },
  sound: {
    volume: 100,
    lowTimeWarning: true,
  },
  UITheme: "dark",
};

export enum AnimSpeedEnum {
  slow = 0.4,
  normal = 0.2,
  fast = 0.1,
  disabled = 0,
}

export const SettingsContext = React.createContext({
  settings: defaultSettings,
  updateSettings: (settings: AppSettings) => {},
});
