import React, { useState, useMemo, useEffect, useRef } from "react";
import * as Chess from "@/lib/chess";
import { TreeHook, TreeNode } from "@/hooks/useTreeData";
import { MdArrowDropDown, MdExpandMore, MdOutlineMenuOpen, MdModeComment } from "react-icons/md";
import { useContextMenu, Menu, Item, Separator, ItemParams } from "react-contexify";
import { BiHide } from "react-icons/bi";

import { VscExpandAll } from "react-icons/vsc";
import { replacePieceChars } from "../game/MoveHistory";
import { NAG } from "./Annotations";
import { notEmpty } from "@/util/misc";
import { AnalysisHook } from "@/hooks/useAnalysisBoard";
interface Props {
  analysis: AnalysisHook;
}

interface ItemProps {
  key: string;
  node: Node;
}

type Row = { nodes: [Node | null, Node | null]; variations?: Node[] };
type Node = TreeNode<Chess.NodeData>;
export default function VarationTree({ analysis }: Props) {
  const { show } = useContextMenu({
    id: "node-context-menu",
  });
  const showContextMenu = (e: React.MouseEvent, node: Node) => {
    show({ event: e, props: { node } });
  };
  const { tree, mainLine, currentKey, setCurrentKey, path, currentNode } = analysis;
  const rootVariations = useMemo(() => tree.treeArray.slice(1), [tree.treeArray]);
  const mainlineRows = useMemo(() => {
    let currentRow: [Node | null, Node | null] = [null, null];
    let rows: Row[] = [];
    mainLine.forEach((node, idx) => {
      const prevNode = mainLine[idx - 1] || null;
      let variations = idx === 0 ? rootVariations : prevNode.children.slice(1);
      const hasComment = node.data.comment;
      const isWhite = node.data.halfMoveCount % 2 !== 0;
      if (currentRow.every((node) => !node)) {
        if (isWhite) {
          if (variations.length || hasComment) rows.push({ nodes: [node, null], variations });
          else currentRow[0] = node;
        } else {
          rows.push({
            nodes: [null, node],
            variations: variations.length ? variations : undefined,
          });
        }
      } else {
        if (!currentRow[0]) throw new Error("Mainline invalid");
        currentRow[1] = node;
        rows.push({ nodes: currentRow, variations: variations.length ? variations : undefined });
        currentRow = [null, null];
      }
    });
    if (currentRow.some((node) => node !== null)) {
      rows.push({ nodes: currentRow });
    }
    return rows;
  }, [mainLine]);
  return (
    <>
      <NodeContextMenu analysis={analysis} />
      <div className="w-full flex flex-col bg-[#121212] divide-y divide-white/[0.2]">
        {mainlineRows.map((row, idx) => {
          return (
            <RenderRow
              showContextMenu={showContextMenu}
              path={path}
              key={idx}
              row={row}
              selectedKey={currentKey}
              setSelectedKey={setCurrentKey}
            />
          );
        })}
      </div>
    </>
  );
}

interface VariationProps {
  path: Node[];
  node: Node;
  selectedKey: string | null;
  setSelectedKey: any;
  depth?: number;
  rootVariations?: Node[];
  showContextMenu: (e: React.MouseEvent, node: Node) => void;
}

function RenderVariation({
  node,
  selectedKey,
  setSelectedKey,
  depth,
  path,
  showContextMenu,
}: VariationProps) {
  const { line, subVariations } = getVariation(node);
  const [expanded, setExpanded] = useState<boolean>(true);
  const forceExpand = useMemo(() => {
    return path.some((pathNode) => subVariations.some((node) => node.key === pathNode.key));
  }, [path, subVariations]);

  useEffect(() => {
    if (forceExpand) {
      setExpanded(true);
    }
  }, [forceExpand]);
  return (
    <div
      className={`w-full ${
        (depth || 0) > 0 ? "border-dotted border-l" : ""
      } border-white/[0.2] text-sm`}
    >
      <div className="flex flex-wrap py-2 pl-4 pr-2 relative rounded">
        <p className="text-sepia/[0.8] indent-[-1.5em] pl-[1.5em]">
          {subVariations.length > 0 && (
            <button
              className={`absolute left-0 top-2  flex flex-col justify-center ${
                forceExpand ? "pointer-none text-white/[0.2]" : "text-sepia"
              }`}
              onClick={() => {
                if (!forceExpand) setExpanded((x) => !x);
              }}
            >
              <MdExpandMore
                className={` transition-transform duration-400 mt-[1px] text-xl ${
                  expanded || forceExpand ? "" : "rotate-[-90deg]"
                }`}
              />
            </button>
          )}
          {line.map((node, index) => {
            return (
              <RenderNode
                showContextMenu={showContextMenu}
                node={node}
                index={index}
                key={node.key}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
              />
            );
          })}
        </p>
        <div className="absolute bottom-0  right-0 left-4  border-white/[0.05] border-b pointer-none box-border"></div>
      </div>
      {subVariations.length > 0 && (expanded || forceExpand) && (
        <div className="pl-3">
          {subVariations.map((node) => (
            <RenderVariation
              showContextMenu={showContextMenu}
              key={node.key}
              node={node}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              depth={depth || 0 + 1}
              path={path}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const getVariation = (node: Node) => {
  let line: Node[] = [];
  let subVariations: Node[] = [];
  let currentNode = node;

  while (currentNode && currentNode.children.length < 2) {
    line.push(currentNode);
    currentNode = currentNode.children[0];
  }
  if (currentNode && currentNode.children.length) {
    line.push(currentNode);

    subVariations = currentNode.children;
  }
  return { line, subVariations };
};

interface RowProps {
  row: Row;
  setSelectedKey: any;
  selectedKey: string | null;
  path: Node[];
  showContextMenu: (e: React.MouseEvent, node: Node) => void;
}
function RenderRow({ row, selectedKey, setSelectedKey, path, showContextMenu }: RowProps) {
  const { nodes, variations } = row;
  //Auto expand
  const [expanded, setExpanded] = useState(true);
  const firstNode = nodes.find((node) => node !== null);
  const comment = nodes.find((node) => node?.data.comment?.length)?.data.comment;
  const forceExpand = useMemo(
    () =>
      path.some((pathNode) => variations && variations.some((node) => node.key === pathNode.key)),
    [path, variations]
  );
  useEffect(() => {
    if (forceExpand) setExpanded(true);
  }, [forceExpand]);
  if (!firstNode) {
    return <></>;
  }
  const moveCount = Math.ceil(firstNode.data.halfMoveCount / 2);
  return (
    <>
      <div className="w-full flex flex-row text-sm">
        <div className="px-4 py-2 w-14 text-center bg-sepia/[0.3] relative">{moveCount}.</div>
        <div className="w-full h-full grid grid-cols-2 bg-[#161616]">
          {nodes.map((node, idx) => (
            <RenderRowEntry
              showContextMenu={showContextMenu}
              key={idx}
              node={node}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          ))}
        </div>
      </div>
      {comment && (
        <div className="w-full p-1 px-2 border-b border-white/[0.2] border-r">
          <p className="text-sepia/[0.8] pl-[2em] indent-[-2em] text-sm">
            <MdModeComment className="opacity-50 inline text-white mr-2" />
            {comment}
          </p>
        </div>
      )}
      {variations && variations.length > 0 && (
        <div
          className={`w-full bg-[#202020]
          }] border-b border-r border-white/[0.2]  pb-[4px] pt-[2px]  pl-2 text-white/[0.6]`}
        >
          {expanded || forceExpand ? (
            <button
              onClick={() => {
                if (!forceExpand) setExpanded(false);
              }}
              className={`text-xs flex flex-row items-center cursor-pointer ${
                forceExpand ? "text-white/[0.2] pointer-none" : ""
              } hover:text-white group`}
            >
              <BiHide className="inline mr-1 mt-[2px]" size={14} />
              <p>Hide Variations</p>
            </button>
          ) : (
            <button
              onClick={() => {
                setExpanded(true);
              }}
              className="text-xs flex flex-row items-center cursor-pointer hover:text-white group"
            >
              <VscExpandAll className="inline mr-1 mt-[2px] group-hover:text-white" size={14} />
              <p>Show Variations</p>
            </button>
          )}
        </div>
      )}
      {expanded && variations && (
        <div className="w-full pl-1 border-r border-white/[0.1] border-b">
          <>
            {variations.map((node) => (
              <RenderVariation
                showContextMenu={showContextMenu}
                key={node.key}
                node={node}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
                depth={0}
                path={path}
              />
            ))}
          </>
        </div>
      )}
    </>
  );
}
interface RowEntryProps {
  node: Node | null;
  selectedKey: string | null;
  setSelectedKey: any;
  showContextMenu: (e: React.MouseEvent, node: Node) => void;
}
function RenderRowEntry({ node, selectedKey, setSelectedKey, showContextMenu }: RowEntryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selected = node?.key === selectedKey;
  const isWhite = node && node.data.halfMoveCount % 2 !== 0;

  useEffect(() => {
    if (!ref.current || !selected) return;
    ref.current.scrollIntoView({ behavior: "smooth" });
  }, [selected, ref]);

  return (
    <div
      ref={ref}
      onClick={() => {
        if (node) {
          setSelectedKey(node.key);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (node) {
          showContextMenu(e, node);
        }
      }}
      className={` border-white/[0.2] border-r h-full p-2 ${
        selected
          ? "bg-blue-400/[0.2] cursor-pointer"
          : node
          ? "hover:bg-white/[0.1] cursor-pointer"
          : ""
      } `}
    >
      <div className="flex flex-row justify-between items-center">
        <p>
          {node ? (
            <MoveText
              pgn={node.data.PGN}
              color={isWhite ? "w" : "b"}
              usePieceIcons={true}
              annotations={node.data.annotations}
            />
          ) : (
            ". . ."
          )}
        </p>
      </div>
    </div>
  );
}

interface NodeProps {
  node: Node;
  selectedKey: string | null;
  setSelectedKey: (key: string) => void;
  index: number;
  showContextMenu: (e: React.MouseEvent, node: Node) => void;
}

function RenderNode({ node, selectedKey, setSelectedKey, index, showContextMenu }: NodeProps) {
  const annotations = node.data.annotations;
  const isWhite = node.data.halfMoveCount % 2 !== 0;
  const selected = selectedKey === node.key;
  const ref = useRef<HTMLSpanElement>(null);
  const nags = useMemo(() => {
    return annotations
      .sort((a, b) => a - b)
      .map((code) => dictionary.find((nag) => nag.code === code))
      .filter(notEmpty);
  }, [annotations]);
  const moveAssesment = useMemo(() => {
    return nags.find((nag) => nag.code >= 1 && nag.code <= 6);
  }, [nags]);
  const annotationStr = useMemo(() => {
    if (moveAssesment) {
      return nags
        .filter((nag) => nag.code !== moveAssesment.code)
        .map((nag) => nag.unicode)
        .join(" ");
    }
    return nags.map((nag) => nag.unicode).join(" ");
  }, [nags]);
  useEffect(() => {
    if (!ref.current || !selected) return;
    //ref.current.scrollIntoView({ behavior: "smooth" });
  }, [selected, ref]);

  return (
    <>
      <span
        ref={ref}
        className={`cursor-pointer inline mx-[1px] py-[1px] px-[2px] rounded hover:bg-white/[0.1] text-white ${
          selected ? "bg-blue-400/[0.2] " : ""
        }`}
        key={node.key}
        onClick={() => {
          setSelectedKey(node.key);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          showContextMenu(e, node);
        }}
      >
        {(isWhite || index === 0) && (
          <span className={`inline ml-[2px] opacity-50 text-white`}>
            {Chess.moveCountToNotation(node.data.halfMoveCount)}
          </span>
        )}
        <span className={`inline ${isWhite ? "" : "mr-[2px]"}`}>
          <MoveText
            pgn={node.data.PGN}
            color={isWhite ? "w" : "b"}
            usePieceIcons={true}
            annotations={moveAssesment ? [moveAssesment.code] : []}
          />
        </span>
      </span>
      {annotationStr.length > 0 && (
        <span className="inline text-white/[0.8] mr-1">{annotationStr}</span>
      )}
      {node.data.comment && " " + node.data.comment + " "}
    </>
  );
}

const dictionary: NAG[] = [
  {
    code: 1,
    description: "Good Move",
    unicode: "\u0021",
    className: "text-green-400",
  },
  {
    code: 2,
    description: "Mistake",
    unicode: "\u003F",
    className: "text-amber-400",
  },
  {
    code: 3,
    description: "Brilliant Move",
    unicode: "\u203C",
    className: "text-teal-400",
  },
  {
    code: 4,
    description: "Blunder",
    unicode: "\u2047",
    className: "text-red-400",
  },
  {
    code: 5,
    description: "Interesting Move",
    unicode: "\u2049",
    className: "text-purple-400",
  },
  {
    code: 6,
    description: "Dubious Move",
    unicode: "\u2048",
    className: "text-fuchsia-400",
  },
  {
    code: 7,
    description: "Forced Move",
    unicode: "\u25A1",
  },

  {
    code: 10,
    description: "Equal Position",
    unicode: "\u003D",
  },
  {
    code: 13,
    description: "Unclear Position",
    unicode: "\u221E ",
  },
  {
    code: 14,
    description: "White has slight advantage",
    unicode: "\u2A72",
  },
  {
    code: 15,
    description: "Black has slight advantage",
    unicode: "\u2A71",
  },
  {
    code: 16,
    description: "White has moderate advantage",
    unicode: "\u00B1",
  },
  {
    code: 17,
    description: "Black has moderate advantage",
    unicode: "\u2213",
  },
  {
    code: 18,
    description: "White has decisive advantage",
    unicode: "\u002B\u002D",
  },
  {
    code: 19,
    description: "Black has decisive advantage",
    unicode: "\u002D\u002B",
  },
  {
    code: 22,
    description: "Zugzwang (white)",
    unicode: "\u2A00",
  },
  {
    code: 23,
    description: "Zugzwang (black)",
    unicode: "\u2A00",
  },
  {
    code: 26,
    description: "Space sdvantage (white)",
    unicode: "\u25CB ",
  },
  {
    code: 27,
    description: "Space sdvantage (black)",
    unicode: "\u25CB ",
  },
  {
    code: 32,
    description: "Time/development Advantage (white)",
    unicode: "\u27F3  ",
  },
  {
    code: 33,
    description: "Time/development Advantage (black)",
    unicode: "\u27F3  ",
  },
  {
    code: 36,
    description: "Initiative (white)",
    unicode: "\u2191",
  },
  {
    code: 37,
    description: "Initiative (black)",
    unicode: "\u2191",
  },
  {
    code: 40,
    description: "White has the attack",
    unicode: "\u2192",
  },
  {
    code: 41,
    description: "Black has the attack",
    unicode: "\u2192",
  },
  {
    code: 132,
    description: "Counterplay (white)",
    unicode: "\u21C6",
  },
  {
    code: 133,
    description: "Counterplay (black)",
    unicode: "\u21C6",
  },
];
interface MoveTextProps {
  pgn: string;
  color: Chess.Color;
  annotations?: number[];
  className?: string;
  usePieceIcons?: boolean;
}
function MoveText({
  pgn,
  color = "w",
  annotations = [],
  className,
  usePieceIcons = true,
}: MoveTextProps) {
  const nags = useMemo(() => {
    return annotations
      .sort((a, b) => a - b)
      .map((code) => dictionary.find((nag) => nag.code === code))
      .filter(notEmpty);
  }, [annotations]);
  const moveAssesment = useMemo(() => {
    return nags.find((nag) => nag.code >= 1 && nag.code <= 6);
  }, [nags]);
  const moveStr = useMemo(() => {
    const move = usePieceIcons ? replacePieceChars(pgn, color) : pgn;
    return moveAssesment ? `${move}${moveAssesment.unicode}` : move;
  }, [pgn, usePieceIcons, color, moveAssesment]);

  const annotationStr = useMemo(() => {
    if (moveAssesment) {
      return nags
        .filter((nag) => nag.code !== moveAssesment.code)
        .map((nag) => nag.unicode)
        .join(" ");
    }
    return nags.map((nag) => nag.unicode).join(" ");
  }, [nags]);
  return (
    <span className={`inline ${className || ""}`}>
      <span className={`inline ${moveAssesment?.className || ""}`}>{moveStr}</span> {annotationStr}
    </span>
  );
}

function NodeContextMenu({ analysis }: { analysis: AnalysisHook }) {
  function handleItemClick({ id, event, props }: ItemParams<ItemProps, any>) {
    const key = props?.node.key;
    switch (id) {
      case "delete":
        if (!key) return;
        analysis.tree.deleteVariation(key);
        break;
      case "promote":
        if (!key) return;
        analysis.tree.promoteVariation(key);
        break;
      case "makeMainline":
        if (!key) return;
        analysis.tree.promoteToMainline(key);
        break;
      case "clearAnnotations":
        if (!key) return;
        analysis.commentControls.updateAnnotations(key, []);
        break;
      case "clearComments":
        if (!key) return;
        analysis.commentControls.updateComment(key, "");
        break;
      default:
        break;
    }
  }
  return (
    <Menu id="node-context-menu" theme="dark" animation="fade">
      <Item id="delete" onClick={handleItemClick}>
        Delete From Here
      </Item>
      <Item id="promote" onClick={handleItemClick}>
        Promote Variation
      </Item>
      <Item id="makeMainline" onClick={handleItemClick}>
        Make Mainline
      </Item>
      <Separator />
      <Item id="clearAnnotations" onClick={handleItemClick}>
        Clear Annotations
      </Item>
      <Item id="clearComments" onClick={handleItemClick}>
        Clear Comments
      </Item>
    </Menu>
  );
}
