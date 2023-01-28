import React, { useState, useMemo } from "react";
import * as Chess from "@/lib/chess";
import { TreeHook, TreeNode } from "@/hooks/useTreeData";
import { ChildProcess } from "child_process";
import { MdArrowDropDown, MdExpandMore } from "react-icons/md";
import { parsePGN } from "../game/MoveHistory";
interface Props {
  mainLine: TreeNode<Chess.NodeData>[];
  selectedKey: string | null;
  setSelectedKey: any;
}

type Node = TreeNode<Chess.NodeData>;
export default function VarationTree({
  mainLine,
  selectedKey,
  setSelectedKey,
}: Props) {
  return (
    <div className="w-[400px] grid grid-cols-2 bg-[#121212] divide-y-2">
      {mainLine.map((node) => (
        <RenderNode
          node={node}
          key={node.key}
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

function RenderVariation({
  node,
  selectedKey,
  setSelectedKey,
  depth,
}: NodeProps) {
  const { line, subVariations } = getVariation(node);
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <div className={`w-full border-dotted border-l border-white/[0.2] text-sm`}>
      <div className="flex flex-wrap py-2 pl-4 relative rounded">
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
        <div className="absolute bottom-0  right-0 left-4 mr-4 border-white/[0.05] border-b pointer-none box-border"></div>

        {subVariations.length > 0 && (
          <button
            className="absolute left-0 top-0 bottom-0 h-full flex flex-col justify-center"
            onClick={() => {
              setExpanded((x) => !x);
            }}
          >
            <MdExpandMore
              className={`text-sepia transition-transform duration-400 mt-[1px] text-xl ${
                expanded ? "" : "rotate-[-90deg]"
              }`}
            />
          </button>
        )}
      </div>
      {subVariations.length > 0 && expanded && (
        <div className="pl-2 ">
          {subVariations.map((node) => (
            <RenderVariation
              key={node.key}
              node={node}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
              depth={depth || 0 + 1}
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

interface NodeProps {
  node: Node;
  selectedKey: string | null;
  setSelectedKey: any;
  depth?: number;
}
function RenderNode({ node, selectedKey, setSelectedKey }: NodeProps) {
  const isWhite = node.data.halfMoveCount % 2 !== 0;
  const variations = node.children.slice(1);
  const hasVariations = variations.length > 0;
  const [expanded, setExpanded] = useState(false);
  const continutaion = mainLineFromNode(node);
  return (
    <>
      <div
        className={`col-span-1 p-2 text-white bg-[#161616]   border-white/[0.2]`}
      >
        {moveCount(node.data.halfMoveCount)}
        {node.data.PGN}
      </div>
      {hasVariations && isWhite ? (
        <div className="relative bg-[#121212]   border-white/[0.2]">
          <p>...</p>
          <button
            className="absolute right-0 top-0 bottom-0 h-full flex flex-col justify-center"
            onClick={() => {
              setExpanded((x) => !x);
            }}
          >
            <MdExpandMore
              className={`transition-transform duration-400 mt-[1px] text-xl ${
                expanded ? "" : "rotate-[-90deg]"
              }`}
            />
          </button>
        </div>
      ) : null}
      {expanded && hasVariations && (
        <div className="w-full pl-2 col-span-2">
          {variations.map((node) => (
            <RenderVariation
              depth={0}
              key={node.key}
              node={node}
              selectedKey={selectedKey}
              setSelectedKey={setSelectedKey}
            />
          ))}
        </div>
      )}
      {hasVariations && isWhite ? (
        <div className="bg-[#121212]  border-white/[0.2]">...</div>
      ) : null}
    </>
  );
}

function mainLineFromNode<T>(node: TreeNode<T>): TreeNode<T>[] {
  let line: TreeNode<T>[] = [];
  if (!node.children[0]) return line;
  let currentNode = node.children[0];
  while (currentNode) {
    line.push(currentNode);
    if (!currentNode.children.length) break;
    currentNode = currentNode.children[0];
  }
  return line;
}
//function RenderLine({ line }: { line: TreeNode<Chess.NodeData>[] });
