console.log("wtf");
import convert from "xml-js";
import _ from "lodash";
import fs from "fs";

import { notEmpty } from "../../util/misc";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<resources>
  <string name="advancedPawn">Advanced pawn</string>
  <string name="advancedPawnDescription">One of your pawns is deep into the opponent position, maybe threatening to promote.</string>
  <string name="advantage">Advantage</string>
  <string name="advantageDescription">Seize your chance to get a decisive advantage. (200cp ≤ eval ≤ 600cp)</string>
  <string name="anastasiaMate">Anastasia's mate</string>
  <string name="anastasiaMateDescription">A knight and rook or queen team up to trap the opposing king between the side of the board and a friendly piece.</string>
  <string name="arabianMate">Arabian mate</string>
  <string name="arabianMateDescription">A knight and a rook team up to trap the opposing king on a corner of the board.</string>
  <string name="attackingF2F7">Attacking f2 or f7</string>
  <string name="attackingF2F7Description">An attack focusing on the f2 or f7 pawn, such as in the fried liver opening.</string>
  <string name="attraction">Attraction</string>
  <string name="attractionDescription">An exchange or sacrifice encouraging or forcing an opponent piece to a square that allows a follow-up tactic.</string>
  <string name="backRankMate">Back rank mate</string>
  <string name="backRankMateDescription">Checkmate the king on the home rank, when it is trapped there by its own pieces.</string>
  <string name="bishopEndgame">Bishop endgame</string>
  <string name="bishopEndgameDescription">An endgame with only bishops and pawns.</string>
  <string name="bodenMate">Boden's mate</string>
  <string name="bodenMateDescription">Two attacking bishops on criss-crossing diagonals deliver mate to a king obstructed by friendly pieces.</string>
  <string name="castling">Castling</string>
  <string name="castlingDescription">Bring the king to safety, and deploy the rook for attack.</string>
  <string name="capturingDefender">Capture the defender</string>
  <string name="capturingDefenderDescription">Removing a piece that is critical to defence of another piece, allowing the now undefended piece to be captured on a following move.</string>
  <string name="crushing">Crushing</string>
  <string name="crushingDescription">Spot the opponent blunder to obtain a crushing advantage. (eval ≥ 600cp)</string>
  <string name="doubleBishopMate">Double bishop mate</string>
  <string name="doubleBishopMateDescription">Two attacking bishops on adjacent diagonals deliver mate to a king obstructed by friendly pieces.</string>
  <string name="dovetailMate">Dovetail mate</string>
  <string name="dovetailMateDescription">A queen delivers mate to an adjacent king, whose only two escape squares are obstructed by friendly pieces.</string>
  <string name="equality">Equality</string>
  <string name="equalityDescription">Come back from a losing position, and secure a draw or a balanced position. (eval ≤ 200cp)</string>
  <string name="kingsideAttack">Kingside attack</string>
  <string name="kingsideAttackDescription">An attack of the opponent's king, after they castled on the king side.</string>
  <string name="clearance">Clearance</string>
  <string name="clearanceDescription">A move, often with tempo, that clears a square, file or diagonal for a follow-up tactical idea.</string>
  <string name="defensiveMove">Defensive move</string>
  <string name="defensiveMoveDescription">A precise move or sequence of moves that is needed to avoid losing material or another advantage.</string>
  <string name="deflection">Deflection</string>
  <string name="deflectionDescription">A move that distracts an opponent piece from another duty that it performs, such as guarding a key square. Sometimes also called "overloading".</string>
  <string name="discoveredAttack">Discovered attack</string>
  <string name="discoveredAttackDescription">Moving a piece (such as a knight), that previously blocked an attack by a long range piece (such as a rook), out of the way of that piece.</string>
  <string name="doubleCheck">Double check</string>
  <string name="doubleCheckDescription">Checking with two pieces at once, as a result of a discovered attack where both the moving piece and the unveiled piece attack the opponent's king.</string>
  <string name="endgame">Endgame</string>
  <string name="endgameDescription">A tactic during the last phase of the game.</string>
  <string name="endgame">En Passant</string>
  <string name="enPassantDescription">A tactic involving the en passant rule, where a pawn can capture an opponent pawn that has bypassed it using its initial two-square move.</string>
  <string name="exposedKing">Exposed king</string>
  <string name="exposedKingDescription">A tactic involving a king with few defenders around it, often leading to checkmate.</string>
  <string name="fork">Fork</string>
  <string name="forkDescription">A move where the moved piece attacks two opponent pieces at once.</string>
  <string name="hangingPiece">Hanging piece</string>
  <string name="hangingPieceDescription">A tactic involving an opponent piece being undefended or insufficiently defended and free to capture.</string>
  <string name="hookMate">Hook mate</string>
  <string name="hookMateDescription">Checkmate with a rook, knight, and pawn along with one enemy pawn to limit the enemy king's escape.</string>
  <string name="interference">Interference</string>
  <string name="interferenceDescription">Moving a piece between two opponent pieces to leave one or both opponent pieces undefended, such as a knight on a defended square between two rooks.</string>
  <string name="intermezzo">Intermezzo</string>
  <string name="intermezzoDescription">Instead of playing the expected move, first interpose another move posing an immediate threat that the opponent must answer. Also known as "Zwischenzug" or "In between".</string>
  <string name="knightEndgame">Knight endgame</string>
  <string name="knightEndgameDescription">An endgame with only knights and pawns.</string>
  <string name="long">Long puzzle</string>
  <string name="longDescription">Three moves to win.</string>
  <string name="master">Master games</string>
  <string name="masterDescription">Puzzles from games played by titled players.</string>
  <string name="masterVsMaster">Master vs Master games</string>
  <string name="masterVsMasterDescription">Puzzles from games between two titled players.</string>
  <string name="mate">Checkmate</string>
  <string name="mateDescription">Win the game with style.</string>
  <string name="mateIn1">Mate in 1</string>
  <string name="mateIn1Description">Deliver checkmate in one move.</string>
  <string name="mateIn2">Mate in 2</string>
  <string name="mateIn2Description">Deliver checkmate in two moves.</string>
  <string name="mateIn3">Mate in 3</string>
  <string name="mateIn3Description">Deliver checkmate in three moves.</string>
  <string name="mateIn4">Mate in 4</string>
  <string name="mateIn4Description">Deliver checkmate in four moves.</string>
  <string name="mateIn5">Mate in 5 or more</string>
  <string name="mateIn5Description">Figure out a long mating sequence.</string>
  <string name="middlegame">Middlegame</string>
  <string name="middlegameDescription">A tactic during the second phase of the game.</string>
  <string name="oneMove">One-move puzzle</string>
  <string name="oneMoveDescription">A puzzle that is only one move long.</string>
  <string name="opening">Opening</string>
  <string name="openingDescription">A tactic during the first phase of the game.</string>
  <string name="pawnEndgame">Pawn endgame</string>
  <string name="pawnEndgameDescription">An endgame with only pawns.</string>
  <string name="pin">Pin</string>
  <string name="pinDescription">A tactic involving pins, where a piece is unable to move without revealing an attack on a higher value piece.</string>
  <string name="promotion">Promotion</string>
  <string name="promotionDescription">Promote one of your pawn to a queen or minor piece.</string>
  <string name="queenEndgame">Queen endgame</string>
  <string name="queenEndgameDescription">An endgame with only queens and pawns.</string>
  <string name="queenRookEndgame">Queen and Rook</string>
  <string name="queenRookEndgameDescription">An endgame with only queens, rooks and pawns.</string>
  <string name="queensideAttack">Queenside attack</string>
  <string name="queensideAttackDescription">An attack of the opponent's king, after they castled on the queen side.</string>
  <string name="quietMove">Quiet move</string>
  <string name="quietMoveDescription">A move that does neither make a check or capture, nor an immediate threat to capture, but does prepare a more hidden unavoidable threat for a later move.</string>
  <string name="rookEndgame">Rook endgame</string>
  <string name="rookEndgameDescription">An endgame with only rooks and pawns.</string>
  <string name="sacrifice">Sacrifice</string>
  <string name="sacrificeDescription">A tactic involving giving up material in the short-term, to gain an advantage again after a forced sequence of moves.</string>
  <string name="short">Short puzzle</string>
  <string name="shortDescription">Two moves to win.</string>
  <string name="skewer">Skewer</string>
  <string name="skewerDescription">A motif involving a high value piece being attacked, moving out the way, and allowing a lower value piece behind it to be captured or attacked, the inverse of a pin.</string>
  <string name="smotheredMate">Smothered mate</string>
  <string name="smotheredMateDescription">A checkmate delivered by a knight in which the mated king is unable to move because it is surrounded (or smothered) by its own pieces.</string>
  <string name="superGM">Super GM games</string>
  <string name="superGMDescription">Puzzles from games played by the best players in the world.</string>
  <string name="trappedPiece">Trapped piece</string>
  <string name="trappedPieceDescription">A piece is unable to escape capture as it has limited moves.</string>
  <string name="underPromotion">Underpromotion</string>
  <string name="underPromotionDescription">Promotion to a knight, bishop, or rook.</string>
  <string name="veryLong">Very long puzzle</string>
  <string name="veryLongDescription">Four moves or more to win.</string>
  <string name="xRayAttack">X-Ray attack</string>
  <string name="xRayAttackDescription">A piece attacks or defends a square, through an enemy piece.</string>
  <string name="zugzwang">Zugzwang</string>
  <string name="zugzwangDescription">The opponent is limited in the moves they can make, and all moves worsen their position.</string>
  <string name="healthyMix">Healthy mix</string>
  <string name="healthyMixDescription">A bit of everything. You don't know what to expect, so you remain ready for anything! Just like in real games.</string>
  <string name="playerGames">Player games</string>
  <string name="playerGamesDescription">Lookup puzzles generated from your games, or from another player's games.</string>
</resources>`;

const obj = convert.xml2js(xml, { compact: false });
const resources = obj.elements[0];
const themePairs = _.chunk(resources.elements, 2);

export interface Theme {
  value: string;
  label: string;
  description: string;
}
let themes: Theme[] = [];
themePairs.forEach((pair) => {
  const [themeEl, descriptionEl] = pair as [any, any];
  console.log(themeEl);
  const theme = {
    value: themeEl.attributes.name as string,
    label: themeEl.elements[0].text as string,
    description: descriptionEl.elements[0].text as string,
  };
  themes.push(theme);
});

const data = {
  themes: themes,
};
console.log(data);
interface ThemeCategoryDict {
  value: string;
  selectAllFilter?: string;
  description?: string;
  label: string;
  themeValues: string[];
}

export interface ThemeCategory extends Omit<ThemeCategoryDict, "themeValues"> {
  themes: Theme[];
}

const themeCategoryDictionary: ThemeCategoryDict[] = [
  {
    value: "tacticalMotifs",
    label: "Tactical Motifs",
    themeValues: [
      "advancedPawn",
      "attraction",
      "capturingDefender",
      "clearance",
      "deflection",
      "discoveredAttack",
      "doubleCheck",
      "exposedKing",
      "fork",
      "hangingPiece",
      "interference",
      "intermezzo",
      "pin",
      "skewer",
      "xRayAttack",
      "zugzwang",
    ],
  },
  {
    value: "objective",
    label: "Objective",
    themeValues: ["equality", "advantage", "crushing", "mate"],
  },
  {
    value: "attacks",
    label: "Attacks",
    themeValues: ["kingsideAttack", "queensideAttack", "attackingF2F7"],
  },
  {
    value: "checkmates",
    label: "Checkmates",
    selectAllFilter: "mate",
    themeValues: [
      "mateIn1",
      "mateIn2",
      "mateIn3",
      "mateIn4",
      "mateIn5",
      "anastasiaMate",
      "arabianMate",
      "backRankMate",
      "bodenMate",
      "doubleBishopMate",
      "doveTailMate",
      "hookMate",
      "smotheredMate",
    ],
  },
  {
    value: "length",
    label: "Puzzle Length",
    themeValues: ["oneMove", "short", "long", "veryLong"],
  },
  {
    value: "moveType",
    label: "Move Types",
    themeValues: ["castling", "defensiveMove", "enPassant", "promotion", "quietMove", "underPromotion"],
  },
  {
    value: "endgames",
    label: "Endgames",
    selectAllFilter: "endgame",
    themeValues: ["bishopEndgame", "knightEndgame", "pawnEndgame", "queenEndgame", "queenRookEndgame", "rookEndgame"],
  },
  {
    value: "stages",
    label: "Game Stages",
    themeValues: ["opening", "middleGame", "endgame"],
  },
  {
    value: "gameSource",
    label: "Game Source",
    themeValues: ["master", "masterVsMaster", "superGM"],
  },
];
console.log("here");
const categories: ThemeCategory[] = themeCategoryDictionary.map((category) => {
  const { themeValues, ...rest } = category;
  const themes = themeValues.map((value) => data.themes.find((theme) => theme.value === value)).filter(notEmpty);
  return {
    ...rest,
    themes,
  };
});

console.log(categories);
fs.writeFile("themeCategories.json", JSON.stringify(categories, null, 2), function (err) {
  if (err) throw err;
  console.log("complete");
});