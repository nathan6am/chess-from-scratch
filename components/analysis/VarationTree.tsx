import React, { useState, useMemo, useEffect, useRef } from "react";
import * as Chess from "@/lib/chess";
import { TreeHook, TreeNode } from "@/hooks/useTreeData";
import { MdArrowDropDown, MdExpandMore, MdOutlineMenuOpen, MdModeComment } from "react-icons/md";

import { BiHide } from "react-icons/bi";

import { VscExpandAll } from "react-icons/vsc";
import { parsePGN } from "../game/MoveHistory";
interface Props {
  mainLine: TreeNode<Chess.NodeData>[];
  rootNodes: TreeNode<Chess.NodeData>[];
  selectedKey: string | null;
  setSelectedKey: any;
  path: Node[];
}

type Row = { nodes: [Node | null, Node | null]; variations?: Node[] };
type Node = TreeNode<Chess.NodeData>;
export default function VarationTree({
  mainLine,
  selectedKey,
  setSelectedKey,
  path,
  rootNodes,
}: Props) {
  const rootVariations = useMemo(() => rootNodes.slice(1), [rootNodes]);
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
    <div className="w-full flex flex-col bg-[#121212] divide-y divide-white/[0.2]">
      {mainlineRows.map((row, idx) => {
        return (
          <RenderRow
            path={path}
            key={idx}
            row={row}
            selectedKey={selectedKey}
            setSelectedKey={setSelectedKey}
          />
        );
      })}
    </div>
  );
}

function moveCount(halfMoveCount: number): string {
  return `${Math.ceil(halfMoveCount / 2)}${halfMoveCount % 2 !== 0 ? ". " : "... "}`;
}
interface VariationProps {
  path: Node[];
  node: Node;
  selectedKey: string | null;
  setSelectedKey: any;
  depth?: number;
  rootVariations?: Node[];
}

function RenderVariation({ node, selectedKey, setSelectedKey, depth, path }: VariationProps) {
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
}
function RenderRow({ row, selectedKey, setSelectedKey, path }: RowProps) {
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
}
function RenderRowEntry({ node, selectedKey, setSelectedKey }: RowEntryProps) {
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
      className={`cursor-pointer border-white/[0.2] border-r h-full p-2 ${
        selected ? "bg-blue-400/[0.2]" : ""
      } `}
    >
      <div className="flex flex-row justify-between items-center">
        <p>{node ? `${parsePGN(node.data.PGN, isWhite ? "w" : "b")}` : ". . ."}</p>
      </div>
    </div>
  );
}

interface NodeProps {
  node: Node;
  selectedKey: string | null;
  setSelectedKey: (key: string) => void;
  index: number;
}

function RenderNode({ node, selectedKey, setSelectedKey, index }: NodeProps) {
  const isWhite = node.data.halfMoveCount % 2 !== 0;
  const selected = selectedKey === node.key;
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !selected) return;
    ref.current.scrollIntoView({ behavior: "smooth" });
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
      >
        {(isWhite || index === 0) && (
          <span className={`inline ml-[2px] opacity-50 text-white`}>
            {moveCount(node.data.halfMoveCount)}
          </span>
        )}
        <span className={`inline ${isWhite ? "" : "mr-[2px]"}`}>
          {parsePGN(node.data.PGN, isWhite ? "w" : "b")}
        </span>
      </span>
      {node.data.comment && " " + node.data.comment + " "}
    </>
  );
}
