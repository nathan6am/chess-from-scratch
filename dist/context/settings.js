"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsContext = exports.AnimSpeedEnum = exports.defaultSettings = void 0;
const react_1 = __importDefault(require("react"));
exports.defaultSettings = {
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
var AnimSpeedEnum;
(function (AnimSpeedEnum) {
    AnimSpeedEnum[AnimSpeedEnum["slow"] = 0.4] = "slow";
    AnimSpeedEnum[AnimSpeedEnum["normal"] = 0.2] = "normal";
    AnimSpeedEnum[AnimSpeedEnum["fast"] = 0.1] = "fast";
    AnimSpeedEnum[AnimSpeedEnum["disabled"] = 0] = "disabled";
})(AnimSpeedEnum = exports.AnimSpeedEnum || (exports.AnimSpeedEnum = {}));
exports.SettingsContext = react_1.default.createContext({
    settings: exports.defaultSettings,
    updateSettings: (settings) => { },
});
