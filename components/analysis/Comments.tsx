import React, { useMemo, useState, useRef } from "react";
import { TreeNode } from "@/hooks/useTreeData";
import * as Chess from "@/lib/chess";
import { MdEdit, MdSave, MdOutlineSaveAlt, MdDelete } from "react-icons/md";

interface Props {
  node: TreeNode<Chess.NodeData> | null;
  controls: {
    updateAnnotations: (nodeKey: string, code: number[]) => void;
    updateComment: (nodeKey: string, comment: string) => void;
  };
}

export default function Comments({ node, controls }: Props) {
  const [commentInput, setCommentInput] = useState<string>(node?.data.comment || "");
  const edited = useMemo(() => {
    if (!node?.data.comment) {
      return commentInput !== "";
    } else {
      return node.data.comment !== commentInput;
    }
  }, [commentInput, node?.data.comment]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [editing, setEditing] = useState(false);
  return (
    <div className="w-full h-fit flex flex-col bg-[#202020] pb-1">
      {/* <div className=" w-full py-2 px-4">Comment</div> */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (!node) return;
          controls.updateComment(node.key, commentInput);
          inputRef.current?.blur();
          setEditing(false);
        }}
      >
        <div className="w-full px-2 pt-2">
          <textarea
            ref={inputRef}
            spellCheck={false}
            placeholder="Add a comment"
            className={`w-full rounded-md border border-white/[0.2] bg-[#161616] resize-none px-2 py-1 ${
              editing ? "text-white" : "text-white/[0.8]"
            }`}
            id="commentInput"
            disabled={!node}
            rows={3}
            value={commentInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!node) return;
                controls.updateComment(node.key, commentInput);
                inputRef.current?.blur();
                setEditing(false);
              }
            }}
            onFocus={() => {
              setEditing(true);
            }}
            onBlur={() => {
              if (!edited) setEditing(false);
            }}
            onChange={(e) => {
              const value = e.target.value.replace(/[\r\n\v]+/g, "");
              setCommentInput(value);
            }}
          />
        </div>
        <div className={`flex flex-row w-full items-start px-2 justify-end`}>
          {!editing && (
            <button
              className="px-2 items-center text-white/[0.7] hover:text-white group justify-self-start py-1 my-1"
              onClick={() => {
                setEditing(true);
                inputRef.current?.focus();
              }}
            >
              <MdEdit className="inline mb-[2px]" /> <p className="inline group-hover:underline">Edit</p>
            </button>
          )}
          {editing && (
            <button
              className="text-red-500 hover:text-red-600 px-3 rounded-sm my-1 py-1 group"
              onClick={() => {
                setCommentInput(node?.data.comment || "");
                inputRef.current?.blur();
                setEditing(false);
              }}
            >
              <MdDelete className="inline mr-1 mb-[2px] text-lg" />
              <p className="inline group-hover:underline">Cancel</p>
            </button>
          )}
          {editing && edited && (
            <button className="bg-green-600 hover:bg-green-700 px-3 rounded-sm my-1 py-1 mr-2" type="submit">
              <MdOutlineSaveAlt className="inline mr-1 mb-[2px] text-lg" />
              Save
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
