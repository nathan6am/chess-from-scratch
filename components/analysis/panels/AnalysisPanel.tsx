import React, { useState, Fragment, useContext } from "react";

import { AnalysisContext } from "@/components/analysis/AnalysisBoard";

//icons
import { MdModeComment } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { AiFillTag, AiFillCheckCircle } from "react-icons/ai";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { MdDriveFileRenameOutline, MdOutlineEditOff } from "react-icons/md";
import { HiSave } from "react-icons/hi";

//content components
import Comments from "@/components/analysis/CommentEditor";
import Annotations from "@/components/analysis/Annotations";
import Share from "@/components/analysis/Share";
import Explorer from "@/components/analysis/Explorer";
import VarationTree from "@/components/analysis/VarationTree";
import EvalInfo from "@/components/analysis/EvalInfo";
import EditDetails from "@/components/analysis/EditDetails";
import RenameDialog from "@/components/dialogs/RenameDialog";

//ui components
import { Button, IconButton } from "@/components/base";
import { PulseLoader } from "react-spinners";
import { ScrollContainer } from "@/components/layout/GameLayout";
import { Tab } from "@headlessui/react";

//hooks
import useFileManager from "@/hooks/useFileManager";
import useAuth from "@/hooks/queries/useAuth";
import Link from "next/link";
import { useMediaQuery } from "@react-hook/media-query";
import { TbGitFork } from "react-icons/tb";

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
  const { user } = useAuth();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const { analysis, saveManager } = useContext(AnalysisContext);
  const [expanded, setExpanded] = useState(true);
  const { onMove, currentNode, commentControls, setMoveQueue } = analysis;
  const isVerticalLayout = useMediaQuery("screen and (max-width: 768px)");
  const fileManager = useFileManager({
    onRenamed: () => {
      setRenameDialogOpen(false);
      saveManager.sync();
    },
  });

  return (
    <>
      <RenameDialog
        isOpen={renameDialogOpen}
        closeModal={() => {
          setRenameDialogOpen(false);
        }}
        currentName={saveManager.data?.analysis.title || ""}
        onConfirm={({ name }) => {
          if (saveManager.id && saveManager.data) {
            fileManager.renameAnalysis({
              analysisId: saveManager.id,
              newName: name,
            });
          } else {
            setRenameDialogOpen(false);
          }
        }}
      />
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
            <EvalInfo />
            <div className="w-full px-4 py-2 bg-elevation-3 flex flex-row items-center justify-between">
              {saveManager.id && saveManager.data ? (
                <>
                  <p>{saveManager.data.analysis.title}</p>
                  {saveManager.data.readonly ? (
                    <div className="flex flex-row items-center">
                      <p className="text-light-300 text-sm mr-1">
                        <MdOutlineEditOff className="inline mr-1" />
                        Readonly
                      </p>
                      <button
                        onClick={saveManager.unLink}
                        className="py-1 px-2 mx-1 rounded-md bg-elevation-5 hover:bg-elevation-6 shadow-sm text-light-100 hover:text-gold-200 text-sm"
                      >
                        <TbGitFork className="inline mr-0.5" />
                        Fork Locally to Edit
                      </button>
                    </div>
                  ) : (
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
                  )}
                </>
              ) : (
                <>
                  {user?.type === "guest" ? (
                    <p
                      className="italic text-sm text-light-400 m-4 my-2 w-full text-center
        "
                    >
                      <Link href="/login" className="underline hover:text-light-300">
                        Login
                      </Link>{" "}
                      or{" "}
                      <Link href="/signup" className="underline hover:text-light-300">
                        make an account
                      </Link>{" "}
                      to save your analyses and access them from anywhere.
                    </p>
                  ) : (
                    <>
                      {" "}
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
                </>
              )}
            </div>

            <div className="w-full grow relative bg-elevation-1 min-h-[6em] md:min-h-0">
              <ScrollContainer>
                <VarationTree inlineView={isVerticalLayout} />
              </ScrollContainer>
            </div>
          </>
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <Explorer explorer={analysis.explorer} onMove={onMove} showPlayer={modalControls.showPlayer} />
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <>
            <div className="w-full px-4 py-2 bg-elevation-3 flex flex-row items-center justify-between">
              {saveManager.id && saveManager.data ? (
                <>
                  <div className="flex flex-row items-center">
                    <p>{saveManager.data.analysis.title}</p>
                    <IconButton
                      icon={MdDriveFileRenameOutline}
                      onClick={() => setRenameDialogOpen(true)}
                      className="inline p-1 m-1"
                    />
                  </div>

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
                  {user?.type === "guest" ? (
                    <>
                      <p
                        className="italic text-sm text-light-400 m-4 my-2 w-full text-center
        "
                      >
                        <Link href="/login" className="underline hover:text-light-300">
                          Login
                        </Link>{" "}
                        or{" "}
                        <Link href="/signup" className="underline hover:text-light-300">
                          make an account
                        </Link>{" "}
                        to save your analyses and access them from anywhere.
                      </p>
                    </>
                  ) : (
                    <>
                      {" "}
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
                </>
              )}
            </div>

            <EditDetails />
          </>
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
          "w-32 rounded-t-md py-1 text-sm text-white/[0.7] px-4",
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
