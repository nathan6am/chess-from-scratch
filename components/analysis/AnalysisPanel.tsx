import React, { useState, Fragment, useContext } from "react";
import { AnalysisContext } from "./AnalysisBoard";
import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import EditDetails from "./EditDetails";
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
import { Input, Button } from "../UIKit";
import { HiSave } from "react-icons/hi";
import { useForm } from "react-hook-form";
import { PulseLoader } from "react-spinners";
import { AiFillCheckCircle } from "react-icons/ai";

interface Props {
  modalControls: {
    showPlayer: () => void;
    showSave: () => void;
    showExport: () => void;
    showShare: () => void;
    showOpenFile: () => void;
    showLoadGame: () => void;
    showEditDetails: () => void;
  };
}
export default function AnalysisPanel({ modalControls }: Props) {
  const { analysis, saveManager } = useContext(AnalysisContext);
  const [expanded, setExpanded] = useState(true);
  const { onMove, currentNode, commentControls, setMoveQueue } = analysis;

  return (
    <>
      <Tab.Group>
        <Tab.List className="flex bg-elevation-1 shadow-lg">
          <TopTab>
            <p>Analyze</p>
          </TopTab>
          <TopTab>
            <p>Explorer</p>
          </TopTab>
          <TopTab>
            <p>Details</p>
          </TopTab>
        </Tab.List>
        <Tab.Panel as={Fragment}>
          <>
            <div className="shadow-md">
              <EvalInfo />
            </div>
            <div className="w-full px-4 py-2 bg-elevation-2 flex flex-row items-center justify-between">
              {saveManager.id && saveManager.data ? (
                <>
                  <p>{saveManager.data.analysis.title}</p>
                  <span className="text-sm text-light-300 flex flex-row items-end">
                    {saveManager.syncStatus === "synced" ? (
                      <>
                        <p>Saved</p>
                        <AiFillCheckCircle className="text-success-400 ml-1 text-md mb-0.5" />
                      </>
                    ) : (
                      <>
                        Saving Changes <PulseLoader size={3} color="#959595" className="mb-[3px] ml-1" />
                      </>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-light-200">{`* Unsaved Analysis`}</p>
                  <Button
                    onClick={modalControls.showSave}
                    className="px-4 py-1"
                    variant="success"
                    label="Save"
                    width="fit"
                    size="sm"
                    icon={HiSave}
                    iconClassName="text-lg ml-1"
                    iconPosition="right"
                  />
                </>
              )}
            </div>

            <div className="w-full grow relative bg-elevation-1">
              <ScrollContainer>
                <VarationTree inlineView />
              </ScrollContainer>
            </div>
          </>
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <Explorer explorer={analysis.explorer} onMove={onMove} showPlayer={modalControls.showPlayer} />
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <EditDetails />
        </Tab.Panel>
      </Tab.Group>
      <div className="w-full border-t border-white/[0.2] ">
        <Tab.Group>
          <Tab.List className="flex bg-elevation-1 pt-1 relative">
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
                <AiFillTag className="inline mr-1 mb-1 " /> Share
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
              <Share />
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
          "flex-1 border-b border-b-4 py-2 text-md  px-4",
          "focus:outline-none ",
          selected
            ? "bg-elevation-3 border-gold-300 text-light-100"
            : "bg-elevation-2 border-elevation-2 text-light-300 hover:bg-elevation-3 hover:border-gold-300 hover:text-light-100"
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
    <div className="py-4 px-6 bg-elevation-2">
      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="White"
          {...register("white")}
          error={errors.white?.message || null}
          id="white"
          placeholder="White Player"
          showErrorMessages={false}
        />
        <Input
          label="Elo"
          containerClassName="w-40 ml-4 mb-2"
          {...register("eloWhite")}
          error={errors.eloWhite?.message || null}
          id="whiteElo"
          placeholder="Rating"
          showErrorMessages={false}
        />
      </div>

      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="Black"
          {...register("black")}
          error={errors.white?.message || null}
          id="black"
          placeholder="Black Player"
          showErrorMessages={false}
        />
        <Input
          label="Elo"
          containerClassName="w-40 ml-4 mb-2"
          {...register("eloBlack")}
          error={errors.eloWhite?.message || null}
          id="eloBlack"
          placeholder="Rating"
          showErrorMessages={false}
        />
      </div>
      <Input
        label="Event"
        {...register("event")}
        error={errors.event?.message || null}
        id="event"
        placeholder="Event"
        showErrorMessages={false}
      />
    </div>
  );
}
