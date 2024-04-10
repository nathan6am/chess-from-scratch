import * as Chess from "../../lib/chess";
import { v4 as uuidv4 } from "uuid";
import { notEmpty } from "../misc";
import { Duration } from "luxon";
import { PGNTagData, TreeNode } from "@/lib/types";
import _ from "lodash";
type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];
import { Game } from "@/server/types/lobby";
import { Arrow, ArrowColor, MarkedSquare } from "@/lib/types";
import { VariationTree } from "@/hooks/useVariationTree";
const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;
const tagExpr = /^\[.* ".*"\]$/;
const bracketsExpr = /^\[(.+(?=\]$))\]$/;
const quoteDelimited = /"[^"]+"/g;
const commandDelimited = /\[%[^\[\]]+\]/g;
const commandTypeExpr = /\B\%\w+/;
interface TagData {
  name: string;
  value: string;
}

interface pgnCommand {
  type: "%csl" | "%cal" | "%clk";
  value: string;
}

function extractCommands(comment: string) {
  const knownTypes: Array<"%csl" | "%cal" | "%clk"> = ["%csl", "%cal", "%clk"];
  const commandsRaw = comment.match(commandDelimited)?.map((str) => str.replace(bracketsExpr, "$1"));
  const remainingComment = comment.replace(commandDelimited, "").trim();
  let commands: pgnCommand[] = [];
  if (commandsRaw && commandsRaw.length) {
    commandsRaw.forEach((str) => {
      const commandType = str.match(commandTypeExpr);
      if (!commandType || !commandType[0]) return;
      const type = knownTypes.find((type) => type === commandType[0]);
      const value = str.replace(commandTypeExpr, "").trim();
      if (type && value) {
        commands.push({ type, value });
      }
    });
  }
  return {
    commands,
    remainingComment,
  };
}

//console.log(extractCommands(sampleArrows));
function isArrowColor(str: string): str is ArrowColor {
  const colors = ["R", "O", "G", "B"];
  if (colors.includes(str)) return true;
  return false;
}
function parseCommands(commands: pgnCommand[]): Partial<Chess.NodeData> {
  let data: Partial<Chess.NodeData> = {};
  commands.forEach((command) => {
    if (command.type === "%csl") {
      const markedSquareNotations = command.value.split(",");
      let markedSquares: MarkedSquare[] = [];
      markedSquareNotations.forEach((notation) => {
        const color = notation.charAt(0);
        const square = notation.slice(1);
        if (Chess.isSquare(square) && isArrowColor(color)) {
          markedSquares.push({ color, square });
        }
      });
      if (markedSquares.length) data.markedSquares = markedSquares;
    } else if (command.type === "%cal") {
      const arrowNotations = command.value.split(",");
      let arrows: Arrow[] = [];
      arrowNotations.forEach((str) => {
        const color = str.charAt(0);
        const [start, end] = str
          .slice(1)
          .split(/(.{2})/)
          .filter((x) => x.length === 2);
        if (isArrowColor(color) && Chess.isSquare(start) && Chess.isSquare(end)) {
          arrows.push({ color, start, end });
        }
      });
      if (arrows.length) data.arrows = arrows;
    } else if (command.type === "%clk") {
      const [hours, minutes, seconds] = command.value.split(":").map((str) => parseInt(str));
      const timeRemaining = Duration.fromObject({ hours, minutes, seconds });
      data.timeRemaining = timeRemaining.toMillis();
    }
  });

  return data;
}

export function encodeCommentFromNodeData(
  data: Chess.NodeData,
  {
    includeArrows = true,
    includeTimeRemaining = true,
    includeComments = true,
  }: { includeArrows?: boolean; includeTimeRemaining?: boolean; includeComments?: boolean }
): string {
  let commentString = "";
  if (data.timeRemaining && includeTimeRemaining) {
    commentString += `[%clk ${Duration.fromMillis(data.timeRemaining).toISOTime()}] `;
  }
  if (data.markedSquares && data.markedSquares.length && includeArrows) {
    commentString += `[%csl ${data.markedSquares
      .map((markedSquare) => `${markedSquare.color}${markedSquare.square}`)
      .join(",")}] `;
  }
  if (data.arrows && data.arrows.length && includeArrows) {
    commentString += `[%cal ${data.arrows.map((arrow) => `${arrow.color}${arrow.start}${arrow.end}`).join(",")}] `;
  }
  if (data.comment && includeComments) {
    commentString += data.comment;
  }
  if (commentString.length) return `{${commentString}} `;
  else return "";
}

function parseTag(tag: string): TagData | undefined {
  const string = tag.replace(bracketsExpr, "$1");
  const result = string.match(quoteDelimited);
  if (!result) return undefined;
  const value = result[0].replace(/^"(.+(?="$))"$/, "$1");
  const name = string.trim().split(" ")[0];
  return {
    name,
    value,
  };
}
export function pgnToJson(pgn: string): { tagData: PGNTagData; movetext: string } {
  let tags: string[] = [];
  let section: "tags" | "movetext" = "tags";
  //Split PGN into tags/movetext sections
  const args = pgn.split(/(\r\n|\n|\r)/gm);
  let movetext = "";
  args.forEach((arg) => {
    if (section === "tags") {
      if (/(\r\n|\n|\r)/gm.test(arg)) {
      } else if (!/\S/.test(arg)) {
        section = "movetext";
      } else if (tagExpr.test(arg.trim())) {
        tags.push(arg.trim());
      } else throw new Error(`Syntax Error: Invalid pgn tag ${arg}`);
    } else if (section === "movetext") {
      if (/(\r\n|\n|\r)/gm.test(arg)) {
      } else {
        movetext += `${arg.trim()} `;
      }
    }
  });
  const parsedTags = tags.map((tag) => parseTag(tag)).filter(notEmpty);

  let tagData: PGNTagData = {};
  parsedTags.forEach((tag) => {
    const dictionary = getEntries(tagsDict);
    const pair = dictionary.find(([key, value]) => {
      return value === tag.name;
    });

    const key = pair && pair[0];
    if (key) {
      Object.assign(tagData, { [key]: tag.value });
    }
  });
  return {
    tagData,
    movetext,
  };
}

const tagsDict: Record<keyof PGNTagData, string> = {
  event: "Event",
  site: "Site",
  date: "Date",
  round: "Round",
  white: "White",
  black: "Black",
  eloWhite: "WhiteElo",
  eloBlack: "BlackElo",
  titleWhite: "WhiteTitle",
  titleBlack: "BlackTitle",
  result: "Result",
  opening: "Opening",
  variation: "Variation",
  subVariation: "SubVariation",
  eco: "ECO",
  fen: "FEN",
  setUp: "SetUp",
  timeControl: "TimeControl",
  termination: "Termination",
};

export function tagDataToPGNString(data: PGNTagData): string {
  let tagsString = "";
  const dataToEncode = _.cloneDeep(data);
  Object.assign(dataToEncode, {
    event: data.event || "?",
    site: data.site || "?",
    date: data.date || "????.??.??",
    round: data.round || "?",
    white: data.white,
    black: data.black,
    result: data.result || "*",
  });
  const entries = getEntries(dataToEncode);
  entries.forEach(([key, value]) => {
    const keyString = tagsDict[key];
    if (value) tagsString += `[${keyString} "${value}"]\r\n`;
  });
  return tagsString;
}
//console.log(pgnToJson(sampleData));
function buildTreeArray<T>(map: Map<string, TreeNode<T>>, parentKey: string | null = null): TreeNode<T>[] {
  if (parentKey === null) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  const parentNode = map.get(parentKey);
  if (!parentNode) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  return parentNode.children;
}

type Node = TreeNode<Chess.NodeData>;

export function mainLineFromTreeArray(treeArray: Node[]) {
  const path: Node[] = [];
  let currentNode = treeArray[0];
  while (currentNode) {
    path.push(currentNode);
    currentNode = currentNode.children[0];
  }
  return path;
}

export function treeFromLine(line: Chess.NodeData[]): Node[] {
  let map = new Map<string, Node>();
  let parentKey: string | null = null;
  const addNode = (data: Chess.NodeData, parentKey: string | null): Node | undefined => {
    const key = uuidv4();
    const newNode = { key, data, parentKey: parentKey, children: [] };
    map.set(newNode.key, newNode);
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) throw new Error("Invalid parent key.");
      parentNode.children.push(newNode);
    }
    return newNode;
  };
  line.forEach((nodeData) => {
    const node = addNode(nodeData, parentKey);
    if (!node) throw new Error("line parse failed");
    parentKey = node.key;
  });
  return buildTreeArray(map);
}

export function parsePgn(pgn: string) {
  const { tagData, movetext } = pgnToJson(pgn);
  const startPosition = tagData.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const tree = parseMoveText(movetext, startPosition);
  return {
    tree,
    tagData,
  };
}

/**
 * Parse standard PGN movetext into initial tree for analysis board
 * @param movetext Standard PGN movetext {@link http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2|- as defined here}
 * @param startPosition FEN string of the start position of the game
 * @returns move tree with parsed data as ``Node[]``
 */
export function parseMoveText(movetext: string, startPosition?: string): Node[] {
  let map = new Map<string, Node>();
  const addNode = (data: Chess.NodeData, parentKey: string | null): Node | undefined => {
    const key = uuidv4();
    const newNode = { key, data, parentKey: parentKey, children: [] };
    map.set(newNode.key, newNode);
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) throw new Error("Invalid parent key.");
      parentNode.children.push(newNode);
    }
    return newNode;
  };

  function getPath(key: string): Node[] {
    const destNode = map.get(key);
    if (!destNode) return [];
    let path: Node[] = [];
    let currentNode: Node | undefined = destNode;
    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.parentKey === null) break;
      const parentNode = map.get(currentNode.parentKey);
      currentNode = parentNode;
    }
    return path;
  }

  let stream = movetext.replace(/(\r\n|\n|\r)/gm, "").trim();
  var lastIndex = stream.lastIndexOf(" ");

  stream = stream.substring(0, lastIndex);
  //console.log(stream);
  const initialGame = Chess.createGame({ startPosition: startPosition });
  //let currentGame = initialGame;
  let reading = "unknown";
  let prevChar = " ";
  let currentData: { pgn?: string; comment: string | null; annotations: number[] } = {
    comment: null,
    annotations: [],
  };
  let currentMove = "";
  let moveCount = "1";
  let comment = "";
  let annotation = "";

  //Stack to maintian move to return to when closing a variation
  let variationStack: Array<Node | null> = [];
  let currentParent: Node | null = null;

  const isDigit = (char: string): boolean => {
    const exp = /\d/;
    return exp.test(char);
  };
  //Get the current game state as a game object based on the parent of the current node being parsed
  const getCurrentGame = () => {
    const node = currentParent;
    if (!node) return initialGame;
    else {
      const currentPath = getPath(node.key);
      return Chess.gameFromNodeData(
        node.data,
        initialGame.config.startPosition,
        currentPath.map((node) => node.data)
      );
    }
  };
  //Add the current node/data to the tree and reset values
  const postCurrentData = () => {
    const pgn = currentData.pgn;
    if (!pgn) throw new Error("Invalid PGN string");
    const currentGame = getCurrentGame();
    //Verify the move text is a valid/legal move
    let move = currentGame.legalMoves.find((move) => move.PGN === pgn.replace("#", "+"));
    if (!move) {
      const withoutExtraChars = currentGame.legalMoves.find(
        (move) => move.PGN.replace(/[#+x]/g, "") === pgn.replace(/[#+x]/g, "")
      );
      if (withoutExtraChars) {
        move = withoutExtraChars;
      } else {
        const cleaned = pgn.replace(/[#+x]/g, "");
        const altPattern = /^[a-h]{2}$/;
        const isAlternatePawnCapture = altPattern.test(cleaned);
        if (isAlternatePawnCapture) {
          const startFile = cleaned.charAt(0);
          const endFile = cleaned.charAt(1);
          const pattern = `^${startFile}x?${endFile}[1-8]$`;
          const expr = new RegExp(pattern);
          const correctMove = currentGame.legalMoves.find((move) => expr.test(move.PGN));
          if (correctMove) {
            move = correctMove;
          }
        }
      }
    }
    if (!move) {
      console.log(pgn);
      console.log(currentGame.legalMoves);
      throw new Error(`Invalid move: ${pgn}`);
    }
    const parentKey = currentParent?.key || null;
    const path = parentKey ? getPath(parentKey) : [];
    //Generate node data from game/move
    const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
    data.annotations = currentData.annotations || [];
    if (currentData.comment) {
      const { commands, remainingComment } = extractCommands(currentData.comment);
      data.comment = remainingComment;
      Object.assign(data, parseCommands(commands));
    } else {
      data.comment = null;
    }
    const node = addNode(data, parentKey);
    if (!node) throw new Error("Something went wrong");
    //Set parent to the newly created node and reset data
    currentParent = node;
    currentData = {
      comment: null,
      annotations: [],
    };
  };
  for (let char of stream) {
    if (reading === "comment") {
      if (char === "}") {
        reading = "unknown";
        currentData.comment = comment;
        comment = "";
      } else {
        comment += char;
      }
    } else if (char === "{") {
      reading = "comment";
    } else if (char === "}" && reading !== "comment") {
      throw new Error("Invalid pgn");
    } else if (reading === "annotation") {
      if (char === " ") {
        if (!annotation.length) throw new Error("Invalid PGN; annotaion flag `$` not followed by valid NAG");
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        reading = "unknown";
      } else if (char === "(") {
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        if (currentData.pgn) postCurrentData();
        //Start a new variation;
        const path: Node[] = currentParent ? getPath(currentParent["key"]) : [];
        const prevParent = path[path.length - 2] || null;
        variationStack.push(currentParent);
        currentParent = prevParent;
        reading = "unknown";
      } else if (char === ")") {
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        if (currentData.pgn) postCurrentData();
        //Close variation; pop last node off the variation stack and set to current parent
        const nextParent = variationStack.pop();
        currentParent = nextParent || null;
        reading = "unknown";
      } else if (!isDigit(char)) {
        console.log(`Character:"${char}"`);
        throw new Error("Invalid NAG annotation code");
      } else {
        annotation += char;
      }
    } else if (char === "$") {
      reading = "annotation";
    } else if ((prevChar === " " || prevChar === ")" || prevChar === "}" || prevChar === "(") && isDigit(char)) {
      reading = "move-count";
      moveCount = char;
      if (currentData.pgn) postCurrentData();
    } else if (char === "(") {
      if (currentData.pgn) postCurrentData();
      const path: Node[] = currentParent ? getPath(currentParent["key"]) : [];
      const prevParent = path[path.length - 2] || null;
      variationStack.push(currentParent);
      currentParent = prevParent;
      console.log(`variationstack: ${variationStack.map((node) => node && node.data.PGN)}`);
    } else if (char === ")") {
      if (currentData.pgn) postCurrentData();
      const nextParent = variationStack.pop();
      currentParent = nextParent || null;
    } else if (reading === "move-count") {
      if (isDigit(char)) moveCount += char;
      else if (char === " ") reading = "pgn";
      else if (char !== ".") {
        currentMove = char;
        reading = "pgn";
      }
    } else if (reading === "pgn") {
      if (char === " " && currentMove.length) {
        reading = "unknown";
        currentData.pgn = currentMove;
        currentMove = "";
      } else if (char === " ") {
        reading = "unknown";
      } else currentMove += char;
    } else if (reading === "unknown") {
      const specialChars = [" ", "$", "(", ")", "{", "}"];
      if (!isDigit(char) && !specialChars.includes(char)) {
        if (currentData.pgn) postCurrentData();
        reading = "pgn";
        currentMove = char;
      }
    }
    prevChar = char;
  }
  //Add last node if not already in tree
  if (currentData.pgn) postCurrentData();
  //Recursively build map into tree array
  return buildTreeArray(map);
}

export function encodeGameToPgn(game: Game): string {
  const { w, b } = game.players;
  let tagData: PGNTagData = {
    white: w.username || undefined,
    black: b.username || undefined,
    eloWhite: `${w.rating}` || undefined,
    eloBlack: `${b.rating}` || undefined,
    event: "NextChess Online Game",
    site: "NextChess.dev",
    result: encodeOutcome(game.data.outcome),
    date: new Date().toISOString().slice(0, 10),
  };
  const termination = encodeTermination(game.data.outcome);
  if (game.data.outcome && termination) {
    tagData.termination = termination;
  }
  const tagSection = tagDataToPGNString(tagData);
  const movetext = moveHistoryToMoveText(game.data.moveHistory) + ` ${encodeOutcome(game.data.outcome)}`;
  return tagSection + "\r\n" + movetext;
}

export function gameDataToPgn(game: Chess.Game, tags: PGNTagData): string {
  let tagData = tags;
  const termination = encodeTermination(game.outcome);
  if (game.outcome && termination) {
    tagData.termination = termination;
  }
  const tagSection = tagDataToPGNString(tagData);
  const movetext = moveHistoryToMoveText(game.moveHistory) + ` ${encodeOutcome(game.outcome)}`;
  return tagSection + "\r\n" + movetext;
}

export function moveHistoryToMoveText(moveHistory: Chess.MoveHistory) {
  let moveText = "";
  moveHistory.forEach((fullmove, idx) => {
    moveText += `${idx + 1}. ${fullmove[0].PGN} `;
    if (fullmove[0].timeRemaining !== undefined)
      moveText += `{ [%clk ${Duration.fromMillis(fullmove[0].timeRemaining).toISOTime()}] } `;
    if (fullmove[1]) {
      if (fullmove[0].timeRemaining !== undefined) moveText += `${idx + 1}... `;
      moveText += `${fullmove[1].PGN} `;
      if (fullmove[1].timeRemaining !== undefined)
        moveText += `{ [%clk ${Duration.fromMillis(fullmove[1].timeRemaining).toISOTime()}] } `;
    }
  });
  return moveText;
}

function encodeOutcome(outcome: Chess.Outcome) {
  if (!outcome) return "*";
  switch (outcome.result) {
    case "w":
      return "1-0";
    case "b":
      return "0-1";
    case "d":
      return "1/2-1/2";
    default:
      return "*";
  }
}

const encodeTermination = (outcome: Chess.Outcome) => {
  let termination = "";
  if (!outcome) return null;
  const { result, by } = outcome;
  if (result === "w") termination += "White wins";
  else if (result === "b") termination += "Black wins";
  else if (result === "d") termination += "Draw";
  if (by === "checkmate") termination += " by checkmate";
  else if (by === "resignation") termination += " by resignation";
  else if (by === "timeout") termination += " on time";
  else if (by === "stalemate") termination += " by stalemate";
  else if (by === "insufficient") termination += " by insufficient material";
  else if (by === "repetition") termination += " by repetition";
  else if (by === "agreement") termination += " by agreement";
  else if (by === "50-move-rule") termination += " by 50 move rule";
  else if (by === "abandonment") termination += " by abandonment";
};
