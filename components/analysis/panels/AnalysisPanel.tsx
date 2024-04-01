import React, { useState, Fragment, useContext } from "react";

import { AnalysisContext } from "@/components/analysis/AnalysisBoard";

//icons
import { MdModeComment } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { AiFillTag, AiFillCheckCircle } from "react-icons/ai";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { HiSave } from "react-icons/hi";

//content components
import Comments from "@/components/analysis/Comments";
import Annotations from "@/components/analysis/Annotations";
import Share from "@/components/analysis/Share";
import Explorer from "@/components/analysis/Explorer";
import VarationTree from "@/components/analysis/VarationTree";
import EvalInfo from "@/components/analysis/EvalInfo";
import EditDetails from "@/components/analysis/EditDetails";

//ui components
import { Button } from "@/components/base";
import { PulseLoader } from "react-spinners";
import { ScrollContainer } from "@/components/layout/GameLayout";
import { Tab } from "@headlessui/react";

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
            <EvalInfo />
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
                        Saving Changes{" "}
                        <PulseLoader size={3} color="#959595" className="mb-[3px] ml-1" />
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
                <VarationTree />
              </ScrollContainer>
            </div>
          </>
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <Explorer
            explorer={analysis.explorer}
            onMove={onMove}
            showPlayer={modalControls.showPlayer}
          />
        </Tab.Panel>
        <Tab.Panel as={Fragment}>
          <>
            <div className="w-full px-4 py-4 bg-elevation-2 flex flex-row items-center justify-between">
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
                        Saving Changes{" "}
                        <PulseLoader size={3} color="#959595" className="mb-[3px] ml-1" />
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
              <Comments
                key={currentNode?.key || "none"}
                node={currentNode}
                controls={commentControls}
              />
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
          selected
            ? "bg-[#202020]"
            : "bg-[#181818] text-white/[0.5] hover:bg-[#202020] hover:text-white"
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
