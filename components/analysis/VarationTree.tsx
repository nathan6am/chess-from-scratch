import React, { useState, useMemo, useEffect } from "react";
import * as Chess from "@/lib/chess";
import { TreeHook, TreeNode } from "@/hooks/useTreeData";
import { ChildProcess } from "child_process";
import {
  MdArrowDropDown,
  MdExpandMore,
  MdOutlineMenuOpen,
} from "react-icons/md";

import { BiHide } from "react-icons/bi";

import { VscExpandAll } from "react-icons/vsc";
import { parsePGN } from "../game/MoveHistory";
import path from "path";
interface Props {
  mainLine: TreeNode<Chess.NodeData>[];
  selectedKey: string | null;
  setSelectedKey: any;
  path: Node[];
}

type Row = [Node | null, Node | null];
type Node = TreeNode<Chess.NodeData>;
export default function VarationTree({
  mainLine,
  selectedKey,
  setSelectedKey,
  path,
}: Props) {
  const mainlineRows = useMemo(() => {
    let currentRow: Row = [null, null];
    let rows: Row[] = [];
    mainLine.forEach((node) => {
      const hasVariations = node.children.length > 1;
      const isWhite = node.data.halfMoveCount % 2 !== 0;
      if (currentRow.every((node) => !node)) {
        if (isWhite) {
          if (hasVariations) rows.push([node, null]);
          else currentRow[0] = node;
        } else {
          rows.push([null, node]);
        }
      } else {
        if (!currentRow[0]) throw new Error("Mainline invalid");
        currentRow[1] = node;
        rows.push(currentRow);
        currentRow = [null, null];
      }
    });
    if (currentRow.some((node) => node !== null)) {
      rows.push(currentRow);
    }
    return rows;
  }, [mainLine]);
  return (
    <div className="w-[400px] flex flex-col bg-[#121212] divide-y divide-white/[0.1]">
      {mainlineRows.map((row, idx) => (
        <RenderRow
          path={path}
          key={idx}
          row={row}
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
        />
      ))}
    </div>
  );
}

function moveCount(halfMoveCount: number): string {
  return `${Math.ceil(halfMoveCount / 2)}${
    halfMoveCount % 2 !== 0 ? ". " : "... "
  }`;
}
interface VariationProps {
  path: Node[];
  node: Node;
  selectedKey: string | null;
  setSelectedKey: any;
  depth?: number;
}

function RenderVariation({
  node,
  selectedKey,
  setSelectedKey,
  depth,
  path,
}: VariationProps) {
  const { line, subVariations } = getVariation(node);
  const [expanded, setExpanded] = useState<boolean>(false);
  const forceExpand = useMemo(() => {
    return path.some((pathNode) =>
      subVariations.some((node) => node.key === pathNode.key)
    );
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
        {line.map((node, index) => {
          const isWhite = node.data.halfMoveCount % 2 !== 0;
          const selected = selectedKey === node.key;
          return (
            <div
              className={`cursor-pointer inline mx-[1px] py-[1px] px-[2px] rounded hover:bg-white/[0.1] ${
                selected ? "bg-blue-400/[0.2] " : ""
              }`}
              key={node.key}
              onClick={() => {
                setSelectedKey(node.key);
              }}
            >
              {(isWhite || index === 0) && (
                <div className={`inline ml-[2px] opacity-50 `}>
                  {moveCount(node.data.halfMoveCount)}
                </div>
              )}
              <p className={`inline ${isWhite ? "" : "mr-[2px]"}`}>
                {parsePGN(node.data.PGN, isWhite ? "w" : "b")}
              </p>
            </div>
          );
        })}
        <div className="absolute bottom-0  right-0 left-4  border-white/[0.05] border-b pointer-none box-border"></div>

        {subVariations.length > 0 && (
          <button
            className={`absolute left-0 top-0 bottom-0 h-full flex flex-col justify-center ${
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
  //Auto expand
  const [expanded, setExpanded] = useState(false);

  const variations = row
    .find((node) => node && node.children.length > 1)
    ?.children.slice(1);
  const firstNode = row.find((node) => node !== null);
  const forceExpand = useMemo(
    () =>
      path.some(
        (pathNode) =>
          variations && variations.some((node) => node.key === pathNode.key)
      ),
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
        <div className="px-4 py-2 bg-sepia/[0.3] relative">{moveCount}.</div>
        <div className="w-full h-full grid grid-cols-2 bg-[#161616]">
          {row.map((node, idx) => (
            <RenderRowEntry
              key={idx}
              node={node}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          ))}
        </div>
      </div>
      {variations && (
        <div
          className={`w-full bg-[#202020]
          }] border-b border-r border-white/[0.1]  pb-[4px] pt-[2px]  pl-2 text-white/[0.6]`}
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
              <VscExpandAll
                className="inline mr-1 mt-[2px] group-hover:text-white"
                size={14}
              />
              <p>Show Variations</p>
            </button>
          )}
        </div>
      )}
      {expanded && variations && (
        <div className="w-full pl-1 border-r border-white/[0.1]">
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
  const selected = node?.key === selectedKey;
  const isWhite = node && node.data.halfMoveCount % 2 !== 0;
  return (
    <div
      onClick={() => {
        if (node) {
          setSelectedKey(node.key);
        }
      }}
      className={`border-r cursor-pointer border-white/[0.1] h-full p-2 ${
        selected ? "bg-blue-400/[0.2]" : ""
      }`}
    >
      <p>
        {node ? `${parsePGN(node.data.PGN, isWhite ? "w" : "b")}` : ". . ."}
      </p>
    </div>
  );
}
