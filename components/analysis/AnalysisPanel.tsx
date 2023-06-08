import React, { useState, Fragment } from "react";
import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import { Tab } from "@headlessui/react";
import EvalInfo from "./EvalInfo";
import { ScrollContainer } from "../layout/GameLayout";
import VarationTree from "./VarationTree";
import { MdModeComment, MdExpandMore } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { AiFillTag } from "react-icons/ai";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { BsShareFill } from "react-icons/bs";
import Comments from "./Comments";
import Annotations from "./Annotations";
import Share from "./Share";
import Explorer from "./Explorer";
import { PGNTagData } from "@/lib/types";
import Input from "../UI/Input";
import { useForm } from "react-hook-form";
import { In } from "typeorm";
interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<HTMLDivElement>;
  showPlayer: () => void;
}
export default function AnalysisPanel({ analysis, boardRef, showPlayer }: Props) {
  const [expanded, setExpanded] = useState(true);
  const {
    onMove,
    evalEnabled,
    setEvalEnabled,
    evaler,
    currentGame,
    currentKey,
    pgn,
    currentNode,
    commentControls,
    setMoveQueue,
  } = analysis;

  const attemptMoves = (moves: string[]) => {
    setMoveQueue(moves);
  };
  return (
    <>
      <Tab.Group>
        <Tab.List className="flex bg-[#121212] shadow-lg">
          <TopTab>
            <p>Analyze</p>
          </TopTab>
          <TopTab>
            <p>Explorer</p>
          </TopTab>
          <TopTab>
            <p>Review</p>
          </TopTab>
        </Tab.List>
        <Tab.Panel as={Fragment}>
          <>
            <div className="shadow-md">
              <EvalInfo
                moveKey={currentKey || "root"}
                evaler={evaler}
                enabled={evalEnabled}
                setEnabled={setEvalEnabled}
                currentGame={currentGame}
                attemptMoves={attemptMoves}
              />
            </div>
            <div className="w-full grow relative bg-white/[0.05]">
              <ScrollContainer>
                <VarationTree analysis={analysis} />
              </ScrollContainer>
            </div>
          </>
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <Explorer explorer={analysis.explorer} onMove={onMove} showPlayer={showPlayer} />
        </Tab.Panel>
      </Tab.Group>
      <div className="w-full border-t border-white/[0.2] ">
        <Tab.Group>
          <Tab.List className="flex bg-[#121212] pt-1 shadow-lg relative">
            <button
              className={`absolute right-2 top-0 bottom-0 flex flex-col justify-center text-white/[0.8] hover:text-white`}
              onClick={() => {
                setExpanded((x) => !x);
              }}
            >
              {expanded ? <VscCollapseAll className="" /> : <VscExpandAll />}
            </button>
            <StyledTab expand={() => setExpanded(true)}>
              <p>
                <MdModeComment className="inline mr-1" /> Comment
              </p>
            </StyledTab>
            <StyledTab expand={() => setExpanded(true)}>
              <p>
                <FaExclamationCircle className="inline mr-1" /> Annotate
              </p>
            </StyledTab>
            <StyledTab expand={() => setExpanded(true)}>
              <p>
                <AiFillTag className="inline mr-1 mb-1 " /> Tags
              </p>
            </StyledTab>
          </Tab.List>
          <Tab.Panels className={expanded ? "" : "hidden"}>
            <Tab.Panel>
              <Comments key={currentNode?.key || "none"} node={currentNode} controls={commentControls} />
            </Tab.Panel>
            <Tab.Panel>
              <Annotations
                key={currentNode?.key || "none"}
                node={currentNode}
                controls={commentControls}
                markupControls={{
                  color: analysis.markupControls.arrowColor,
                  setSelectedColor: analysis.markupControls.setArrowColor,
                  clear: analysis.markupControls.onClear,
                  locked: false,
                  toggleLocked: () => {},
                }}
              />
            </Tab.Panel>
            <Tab.Panel>
              <TagForm tags={analysis.tagData} setTags={analysis.setTagData} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface StyledTabProps {
  children?: JSX.Element | JSX.Element[] | string;
  expand: () => void;
}
function StyledTab({ children, expand }: StyledTabProps) {
  return (
    <Tab
      onClick={expand}
      className={({ selected }) =>
        classNames(
          "w-32 rounded-t-md py-1 text-md text-white/[0.7] px-4",
          "focus:outline-none ",
          selected ? "bg-[#202020]" : "bg-[#181818] text-white/[0.5] hover:bg-[#202020] hover:text-white"
        )
      }
    >
      {children}
    </Tab>
  );
}
interface TabProps {
  children?: JSX.Element | JSX.Element[] | string;
}
function TopTab({ children }: TabProps) {
  return (
    <Tab
      className={({ selected }) =>
        classNames(
          "flex-1 border-b border-b-4 py-2 text-md text-white/[0.7] px-4",
          "focus:outline-none ",
          selected
            ? "bg-[#303030] border-sepia"
            : "bg-[#262626] border-[#262626] text-white/[0.5] hover:bg-[#202020] hover:text-white"
        )
      }
    >
      {children}
    </Tab>
  );
}
interface TagFormProps {
  tags: PGNTagData;
  setTags: React.Dispatch<React.SetStateAction<PGNTagData>>;
}
function TagForm({ tags, setTags }: TagFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PGNTagData>({ defaultValues: tags, mode: "onBlur" });

  const submitHandler = (data: PGNTagData) => {
    setTags(data);
  };
  return (
    <div className="py-4 px-6 bg-[#202020]">
      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-0"
          label="White"
          {...register("white")}
          error={errors.white?.message || null}
          id="white"
          placeholder="White Player"
          status={null}
        />
        <Input
          label="Elo"
          containerClassName="w-20 ml-4 mb-0"
          {...register("eloWhite")}
          error={errors.eloWhite?.message || null}
          id="whiteElo"
          placeholder="Rating"
          status={null}
        />
      </div>

      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-0"
          label="Black"
          {...register("black")}
          error={errors.white?.message || null}
          id="black"
          placeholder="Black Player"
          status={null}
        />
        <Input
          label="Elo"
          containerClassName="w-20 ml-4 mb-0"
          {...register("eloBlack")}
          error={errors.eloWhite?.message || null}
          id="eloBlack"
          placeholder="Rating"
          status={null}
        />
      </div>
      <Input label="Event" {...register("event")} error={errors.event?.message || null} id="event" status={null} />
    </div>
  );
}
