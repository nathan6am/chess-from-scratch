import React, { useCallback, useMemo, useState } from "react";
import CheckBox from "../UI/CheckBox";
import useSet, { SetHook } from "@/hooks/useSet";
import * as categories from "./themeCategories.json";
import { ThemeCategory, Theme } from "./themes";
import { BsInfoCircle } from "react-icons/bs";
const CATEGORIES = [
  {
    value: "tacticalMotifs",
    label: "Tactical Motifs",
    themes: [
      {
        value: "advancedPawn",
        label: "Advanced pawn",
        description: "One of your pawns is deep into the opponent position, maybe threatening to promote.",
      },
      {
        value: "attraction",
        label: "Attraction",
        description:
          "An exchange or sacrifice encouraging or forcing an opponent piece to a square that allows a follow-up tactic.",
      },
      {
        value: "capturingDefender",
        label: "Capture the defender",
        description:
          "Removing a piece that is critical to defence of another piece, allowing the now undefended piece to be captured on a following move.",
      },
      {
        value: "clearance",
        label: "Clearance",
        description: "A move, often with tempo, that clears a square, file or diagonal for a follow-up tactical idea.",
      },
      {
        value: "deflection",
        label: "Deflection",
        description:
          'A move that distracts an opponent piece from another duty that it performs, such as guarding a key square. Sometimes also called "overloading".',
      },
      {
        value: "discoveredAttack",
        label: "Discovered attack",
        description:
          "Moving a piece (such as a knight), that previously blocked an attack by a long range piece (such as a rook), out of the way of that piece.",
      },
      {
        value: "doubleCheck",
        label: "Double check",
        description:
          "Checking with two pieces at once, as a result of a discovered attack where both the moving piece and the unveiled piece attack the opponent's king.",
      },
      {
        value: "exposedKing",
        label: "Exposed king",
        description: "A tactic involving a king with few defenders around it, often leading to checkmate.",
      },
      {
        value: "fork",
        label: "Fork",
        description: "A move where the moved piece attacks two opponent pieces at once.",
      },
      {
        value: "hangingPiece",
        label: "Hanging piece",
        description:
          "A tactic involving an opponent piece being undefended or insufficiently defended and free to capture.",
      },
      {
        value: "interference",
        label: "Interference",
        description:
          "Moving a piece between two opponent pieces to leave one or both opponent pieces undefended, such as a knight on a defended square between two rooks.",
      },
      {
        value: "intermezzo",
        label: "Intermezzo",
        description:
          'Instead of playing the expected move, first interpose another move posing an immediate threat that the opponent must answer. Also known as "Zwischenzug" or "In between".',
      },
      {
        value: "pin",
        label: "Pin",
        description:
          "A tactic involving pins, where a piece is unable to move without revealing an attack on a higher value piece.",
      },
      {
        value: "skewer",
        label: "Skewer",
        description:
          "A motif involving a high value piece being attacked, moving out the way, and allowing a lower value piece behind it to be captured or attacked, the inverse of a pin.",
      },
      {
        value: "xRayAttack",
        label: "X-Ray attack",
        description: "A piece attacks or defends a square, through an enemy piece.",
      },
      {
        value: "zugzwang",
        label: "Zugzwang",
        description: "The opponent is limited in the moves they can make, and all moves worsen their position.",
      },
    ],
  },
  {
    value: "objective",
    label: "Objective",
    themes: [
      {
        value: "equality",
        label: "Equality",
        description: "Come back from a losing position, and secure a draw or a balanced position. (eval ≤ 200cp)",
      },
      {
        value: "advantage",
        label: "Advantage",
        description: "Seize your chance to get a decisive advantage. (200cp ≤ eval ≤ 600cp)",
      },
      {
        value: "crushing",
        label: "Crushing",
        description: "Spot the opponent blunder to obtain a crushing advantage. (eval ≥ 600cp)",
      },
      {
        value: "mate",
        label: "Checkmate",
        description: "Win the game with style.",
      },
    ],
  },
  {
    value: "attacks",
    label: "Attacks",
    themes: [
      {
        value: "kingsideAttack",
        label: "Kingside attack",
        description: "An attack of the opponent's king, after they castled on the king side.",
      },
      {
        value: "queensideAttack",
        label: "Queenside attack",
        description: "An attack of the opponent's king, after they castled on the queen side.",
      },
      {
        value: "attackingF2F7",
        label: "Attacking f2 or f7",
        description: "An attack focusing on the f2 or f7 pawn, such as in the fried liver opening.",
      },
    ],
  },
  {
    value: "checkmates",
    label: "Checkmates",
    selectAllFilter: "mate",
    themes: [
      {
        value: "mateIn1",
        label: "Mate in 1",
        description: "Deliver checkmate in one move.",
      },
      {
        value: "mateIn2",
        label: "Mate in 2",
        description: "Deliver checkmate in two moves.",
      },
      {
        value: "mateIn3",
        label: "Mate in 3",
        description: "Deliver checkmate in three moves.",
      },
      {
        value: "mateIn4",
        label: "Mate in 4",
        description: "Deliver checkmate in four moves.",
      },
      {
        value: "mateIn5",
        label: "Mate in 5 or more",
        description: "Figure out a long mating sequence.",
      },
      {
        value: "anastasiaMate",
        label: "Anastasia's mate",
        description:
          "A knight and rook or queen team up to trap the opposing king between the side of the board and a friendly piece.",
      },
      {
        value: "arabianMate",
        label: "Arabian mate",
        description: "A knight and a rook team up to trap the opposing king on a corner of the board.",
      },
      {
        value: "backRankMate",
        label: "Back rank mate",
        description: "Checkmate the king on the home rank, when it is trapped there by its own pieces.",
      },
      {
        value: "bodenMate",
        label: "Boden's mate",
        description:
          "Two attacking bishops on criss-crossing diagonals deliver mate to a king obstructed by friendly pieces.",
      },
      {
        value: "doubleBishopMate",
        label: "Double bishop mate",
        description:
          "Two attacking bishops on adjacent diagonals deliver mate to a king obstructed by friendly pieces.",
      },
      {
        value: "hookMate",
        label: "Hook mate",
        description:
          "Checkmate with a rook, knight, and pawn along with one enemy pawn to limit the enemy king's escape.",
      },
      {
        value: "smotheredMate",
        label: "Smothered mate",
        description:
          "A checkmate delivered by a knight in which the mated king is unable to move because it is surrounded (or smothered) by its own pieces.",
      },
    ],
  },
  {
    value: "length",
    label: "Puzzle Length",
    themes: [
      {
        value: "oneMove",
        label: "One-move puzzle",
        description: "A puzzle that is only one move long.",
      },
      {
        value: "short",
        label: "Short puzzle",
        description: "Two moves to win.",
      },
      {
        value: "long",
        label: "Long puzzle",
        description: "Three moves to win.",
      },
      {
        value: "veryLong",
        label: "Very long puzzle",
        description: "Four moves or more to win.",
      },
    ],
  },
  {
    value: "moveType",
    label: "Move Types",
    themes: [
      {
        value: "castling",
        label: "Castling",
        description: "Bring the king to safety, and deploy the rook for attack.",
      },
      {
        value: "defensiveMove",
        label: "Defensive move",
        description:
          "A precise move or sequence of moves that is needed to avoid losing material or another advantage.",
      },
      {
        value: "promotion",
        label: "Promotion",
        description: "Promote one of your pawn to a queen or minor piece.",
      },
      {
        value: "quietMove",
        label: "Quiet move",
        description:
          "A move that does neither make a check or capture, nor an immediate threat to capture, but does prepare a more hidden unavoidable threat for a later move.",
      },
      {
        value: "underPromotion",
        label: "Underpromotion",
        description: "Promotion to a knight, bishop, or rook.",
      },
    ],
  },
  {
    value: "endgames",
    label: "Endgames",
    selectAllFilter: "endgame",
    themes: [
      {
        value: "bishopEndgame",
        label: "Bishop endgame",
        description: "An endgame with only bishops and pawns.",
      },
      {
        value: "knightEndgame",
        label: "Knight endgame",
        description: "An endgame with only knights and pawns.",
      },
      {
        value: "pawnEndgame",
        label: "Pawn endgame",
        description: "An endgame with only pawns.",
      },
      {
        value: "queenEndgame",
        label: "Queen endgame",
        description: "An endgame with only queens and pawns.",
      },
      {
        value: "queenRookEndgame",
        label: "Queen and Rook",
        description: "An endgame with only queens, rooks and pawns.",
      },
      {
        value: "rookEndgame",
        label: "Rook endgame",
        description: "An endgame with only rooks and pawns.",
      },
    ],
  },
  {
    value: "stages",
    label: "Game Stages",
    themes: [
      {
        value: "opening",
        label: "Opening",
        description: "A tactic during the first phase of the game.",
      },
      {
        value: "middlegame",
        label: "Middlegame",
        description: "A tactic during the second phase of the game.",
      },
      {
        value: "endgame",
        label: "Endgame",
        description: "A tactic during the last phase of the game.",
      },
    ],
  },
  {
    value: "gameSource",
    label: "Game Source",
    themes: [
      {
        value: "master",
        label: "Master games",
        description: "Puzzles from games played by titled players.",
      },
      {
        value: "masterVsMaster",
        label: "Master vs Master games",
        description: "Puzzles from games between two titled players.",
      },
      {
        value: "superGM",
        label: "Super GM games",
        description: "Puzzles from games played by the best players in the world.",
      },
    ],
  },
];
export default function PuzzleFilters() {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const addThemes = (themes: string[]) => {
    setSelectedThemes((current) => {
      return Array.from(new Set([...current, ...themes]).values());
    });
  };

  const removeThemes = (themes: string[]) => {
    setSelectedThemes((current) => {
      return current.filter((theme) => !themes.includes(theme));
    });
  };
  return (
    <div>
      {CATEGORIES.map((category) => (
        <RenderCategory
          addThemes={addThemes}
          removeThemes={removeThemes}
          category={category}
          selectedThemes={selectedThemes}
          key={category.value}
        />
      ))}
    </div>
  );
}

interface CategoryProps {
  selectedThemes: string[];
  category: ThemeCategory;
  addThemes: (themes: string[]) => void;
  removeThemes: (themes: string[]) => void;
}
function RenderCategory({ selectedThemes, category, addThemes, removeThemes }: CategoryProps) {
  const values = useMemo(() => {
    return category.themes.map((theme) => theme.value);
  }, [category]);
  const allSelected = useMemo(() => values.every((value) => selectedThemes.includes(value)), [selectedThemes, values]);
  const indeterminate = useMemo(
    () => !allSelected && values.some((theme) => selectedThemes.includes(theme)),
    [allSelected, selectedThemes, values]
  );

  const selectAll = useCallback(() => {
    addThemes(values);
  }, [values, addThemes]);
  const deselectAll = useCallback(() => {
    removeThemes(values);
  }, [values, removeThemes]);

  return (
    <div className="my-2">
      <CheckBox
        className="my-1"
        label={category.label}
        checked={allSelected}
        indeterminate={indeterminate}
        onChange={(enabled) => {
          if (enabled) {
            selectAll();
          } else {
            deselectAll();
          }
        }}
      />
      <div className="pl-4">
        {category.themes.map((theme) => {
          return (
            <RenderTheme
              key={theme.value}
              theme={theme}
              selectedThemes={selectedThemes}
              onChange={(enabled) => {
                if (enabled) addThemes([theme.value]);
                else removeThemes([theme.value]);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function RenderTheme({
  selectedThemes,
  onChange,
  theme,
}: {
  selectedThemes: string[];
  onChange: (enabled: boolean) => void;
  theme: Theme;
}) {
  const selected = useMemo(() => selectedThemes.includes(theme.value), [selectedThemes, theme]);
  return (
    <div className="flex flex-row items-center my-1">
      <CheckBox label={theme.label} onChange={onChange} checked={selected} />
      <a data-tooltip-id="my-tooltip" data-tooltip-content={theme.description} className="opacity-50">
        <BsInfoCircle className="text-sm ml-1" />
      </a>
    </div>
  );
}
