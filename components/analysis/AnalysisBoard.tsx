import React, { useState, useRef, Fragment, useContext, useMemo } from "react";
import * as Chess from "@/lib/chess";

import Board from "../game/Board";
import EvalBar from "./EvalBar";
import { BoardRow, BoardColumn, PanelColumnLg } from "../layout/GameLayout";
import BoardControls from "../game/BoardControls";
import OptionsOverlay from "../UI/dialogs/OptionsOverlay";
import PopupPlayer from "./PopupPlayer";
import Explorer from "./Explorer";
import { Tab, Menu, Transition } from "@headlessui/react";
import SaveAnalysis from "../UI/dialogs/SaveAnalysis";
import AnalysisPanel from "./AnalysisPanel";
import { MdSettings } from "react-icons/md";

import { SettingsContext } from "@/context/settings";
import useSavedAnalysis from "@/hooks/useSavedAnalysis";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";

import { tagDataToPGNString } from "@/util/parsers/pgnParser";
import BoardArrows from "./BoardArrows";
export default function AnalysisBoard() {
  const analysis = useAnalysisBoard();
  const boardRef = useRef<HTMLDivElement>(null);
  const {
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    setEvalEnabled,
    boardControls,
    moveText,
    explorer,
    currentNode,
  } = analysis;
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const { settings } = useContext(SettingsContext);
  const [saveModalShown, setSaveModalShown] = useState(false);
  const [popupPlayerShown, setPopupPlayerShown] = useState(false);
  const [optionsOverlayShown, setOptionsOverlayShown] = useState(false);
  const lastMoveAnnotation = useMemo(() => {
    return currentNode?.data.annotations.find((code) => code >= 1 && code <= 7);
  }, [currentNode, currentNode?.data.annotations]);
  const saveManager = useSavedAnalysis();
  const flipBoard = () => {
    setOrientation((cur) => (cur === "w" ? "b" : "w"));
  };
  const saveCurrent = () => {
    const analysis = saveManager.data?.analysis;
    if (!analysis) return;
    const id = analysis.id;
    const { title, collectionIds, description, visibility, tagData } = analysis;
    const pgn = tagDataToPGNString(tagData) + "\r\n" + moveText + " *";

    saveManager.save({
      id,
      data: {
        title,
        description,
        collectionIds,
        visibility,
        tagData,
        pgn,
      },
    });
  };
  return (
    <>
      <OptionsOverlay
        isOpen={optionsOverlayShown}
        closeModal={() => {
          setOptionsOverlayShown(false);
        }}
      />
      <PopupPlayer
        loading={explorer.otbGameLoading}
        shown={popupPlayerShown}
        pgn={explorer.otbGamePgn || ""}
        closePlayer={() => {
          setPopupPlayerShown(false);
        }}
      />
      <SaveAnalysis
        moveText={moveText}
        save={saveManager.saveAs}
        isOpen={saveModalShown}
        closeModal={() => {
          setSaveModalShown(false);
        }}
      />
      <div className="flex flex-col h-full w-full justify-center">
        <ToolBar
          showOptions={() => {
            setOptionsOverlayShown(true);
          }}
          saveCurrent={saveCurrent}
          showSave={() => {
            setSaveModalShown(true);
          }}
        />

        <BoardRow>
          <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
            <BoardColumn className={`${evalEnabled ? "items-center" : "items-center"} relative`}>
              {/* <p className="absolute top-[-2em] p-1 px-4 bg-white/[0.1]">
                Carlsen, M. <span className="inline opacity-50">(2882)</span>
              </p>
              <p className="absolute bottom-[-2em] p-1 px-4 bg-white/[0.1]">
                Caruana, F. <span className="inline opacity-50">(2818)</span>
              </p> */}
              <BoardArrows>
                <Board
                  lastMoveAnnotation={lastMoveAnnotation}
                  showCoordinates={settings.display.showCoordinates}
                  movementType={settings.gameBehavior.movementType}
                  theme={settings.display.boardTheme}
                  pieceSet={settings.display.pieceTheme}
                  ref={boardRef}
                  orientation={orientation}
                  legalMoves={currentGame.legalMoves}
                  showHighlights={settings.display.showHighlights}
                  showTargets={settings.display.showValidMoves}
                  pieces={currentGame.board}
                  animationSpeed={settings.display.animationSpeed}
                  lastMove={currentGame.lastMove}
                  activeColor={currentGame.activeColor}
                  moveable={"both"}
                  preMoveable={false}
                  autoQueen={settings.gameBehavior.autoQueen}
                  onMove={onMove}
                  onPremove={() => {}}
                />
              </BoardArrows>
            </BoardColumn>
            {evalEnabled && evaler.currentOptions.showEvalBar && (
              <EvalBar
                scoreType={evaler.currentScore?.type || "cp"}
                value={evaler.currentScore?.value || 0}
                orientation={orientation}
                scale={9.06}
                key={orientation}
              />
            )}
          </div>

          <PanelColumnLg className="bg-[#1f1f1f]">
            <Tab.Group>
              <Tab.List className="flex bg-[#121212] shadow-lg">
                <StyledTab>
                  <p>Analyze</p>
                </StyledTab>
                <StyledTab>
                  <p>Explorer</p>
                </StyledTab>
                <StyledTab>
                  <p>Review</p>
                </StyledTab>
                <div className="h-inherit w-10">
                  <MdSettings />
                </div>
              </Tab.List>
              <Tab.Panel as={Fragment}>
                <AnalysisPanel analysis={analysis} boardRef={boardRef} />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <Explorer
                  explorer={explorer}
                  onMove={onMove}
                  showPlayer={() => {
                    setPopupPlayerShown(true);
                  }}
                />
              </Tab.Panel>
            </Tab.Group>
            <BoardControls controls={boardControls} flipBoard={flipBoard} />
          </PanelColumnLg>
        </BoardRow>
      </div>
    </>
  );
}
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface TabProps {
  children?: JSX.Element | JSX.Element[] | string;
}
function StyledTab({ children }: TabProps) {
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

interface ToolBarProps {
  showSave: () => void;
  saveCurrent: () => void;
  showOptions: () => void;
}
function ToolBar({ showSave, saveCurrent, showOptions }: ToolBarProps) {
  return (
    <div className="w-full h-8 bg-[#404040] justify-center items-center flex relative">
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent via-white/[0.03] via-white/[0.04] to-white/[0.02]"></div>
      <div className="container flex flex-row items-center lg:px-4 xl:px-8">
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                File
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem onClick={saveCurrent}>Save</MenuItem>
                <MenuItem onClick={showSave}>Save As</MenuItem>
                <MenuItem disabled onClick={() => {}}>
                  Edit Details
                </MenuItem>
                <MenuItem onClick={() => {}}>Fork</MenuItem>
                <MenuItem onClick={() => {}}>Load Game</MenuItem>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                Share/Export
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem onClick={() => {}}>Export PGN</MenuItem>
                <MenuItem onClick={() => {}}>Download Image</MenuItem>
                <MenuItem disabled onClick={() => {}}>
                  Get Shareable Link
                </MenuItem>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                Current Line
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem onClick={() => {}}>Delete from Here</MenuItem>
                <MenuItem onClick={() => {}}>Delete from Start</MenuItem>
                <MenuItem onClick={() => {}}>Make mainline</MenuItem>
                <MenuItem onClick={() => {}}>New Analysis from Current Line</MenuItem>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                Position
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem onClick={() => {}}>Play vs. Computer</MenuItem>
                <MenuItem onClick={() => {}}>Play vs. a friend</MenuItem>
                <MenuItem onClick={() => {}}>Set up Board</MenuItem>
                <MenuItem onClick={() => {}}>Copy FEN</MenuItem>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                Settings
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem onClick={showOptions}>App Settings</MenuItem>
                <MenuItem onClick={() => {}}>Explorer Settings</MenuItem>
                <MenuItem onClick={() => {}}>Layout</MenuItem>
                <MenuItem onClick={() => {}}>Show Annotations on Board</MenuItem>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}

function Example() {
  return (
    <div>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
            File
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-[#404040] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <MenuItem onClick={() => {}}>Save Analysis</MenuItem>
            <MenuItem disabled onClick={() => {}}>
              Edit Details
            </MenuItem>
            <MenuItem onClick={() => {}}>Save a Copy</MenuItem>
            <MenuItem onClick={() => {}}>Add to Collection</MenuItem>
            <MenuItem onClick={() => {}}>Load Game</MenuItem>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}

interface MenuItemProps {
  children?: string | JSX.Element | Array<string | JSX.Element>;
  disabled?: boolean;
  onClick: any;
}
function MenuItem({ children, disabled, onClick }: MenuItemProps) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${
            active ? "bg-white/[0.1] text-white" : "text-white/[0.8]"
          } group flex flex-row w-full  px-2 py-2 text-sm ${
            disabled ? "pointer-none text-white/[0.3]" : ""
          }`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}
