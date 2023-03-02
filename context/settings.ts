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
    usePieceIcons: boolean;
    showCapturedMaterial: boolean;
    boardTheme: string;
    pieceTheme: string;
  };
  sound: {
    volume: number;
    lowTimeWarning: boolean;
    moveSounds: boolean;
    invalidMoveSounds: boolean;
    notifcationSounds: boolean;
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
    usePieceIcons: true,
    boardTheme: "default",
    pieceTheme: "default",
  },

  sound: {
    volume: 100,
    lowTimeWarning: true,
    moveSounds: true,
    invalidMoveSounds: true,
    notifcationSounds: true,
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
  updateSettings: (settings: Partial<AppSettings>) => {},
});
