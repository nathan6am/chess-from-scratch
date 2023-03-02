import React, { useState, useRef, Fragment, useContext } from "react";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import * as Chess from "@/lib/chess";
import { BoardRow, BoardColumn, PanelColumnLg, LayoutComponentProps } from "../layout/GameLayout";
import Board from "../game/Board";
import EvalBar from "./EvalBar";
import { SettingsContext } from "@/context/settings";
import BoardControls from "../game/BoardControls";
import PopupPlayer from "./PopupPlayer";
import Explorer from "./Explorer";
import { Tab, Menu, Transition } from "@headlessui/react";

import AnalysisPanel from "./AnalysisPanel";
import { MdSettings } from "react-icons/md";
export default function AnalysisBoard() {
  const analysis = useAnalysisBoard();
  const {
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    setEvalEnabled,
    boardControls,
    pgn,
    mainLine,
    rootNodes,
    setCurrentKey,
    path,
    currentKey,
    debouncedNode,
    currentNode,
    commentControls,
    explorer,
  } = analysis;
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const boardRef = useRef<HTMLDivElement>(null);
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <>
      <div className="flex flex-col h-full w-full justify-center">
        <ToolBar />

        <BoardRow>
          <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
            <BoardColumn className={`${evalEnabled ? "items-center" : "items-center"} relative`}>
              {/* <p className="absolute top-[-2em] p-1 px-4 bg-white/[0.1]">
                Carlsen, M. <span className="inline opacity-50">(2882)</span>
              </p>
              <p className="absolute bottom-[-2em] p-1 px-4 bg-white/[0.1]">
                Caruana, F. <span className="inline opacity-50">(2818)</span>
              </p> */}
              <Board
                movementType={settings.gameBehavior.movementType}
                pieceSet="maestro"
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
                  data={explorer.data}
                  error={explorer.error}
                  isLoading={explorer.isLoading}
                  currentGame={explorer.sourceGame}
                  onMove={onMove}
                />
              </Tab.Panel>
            </Tab.Group>
            <BoardControls
              controls={boardControls}
              flipBoard={() => {
                setOrientation((cur) => (cur === "w" ? "b" : "w"));
              }}
            />
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

function ToolBar() {
  return (
    <div className="w-full h-8 bg-[#404040] justify-center items-center flex relative">
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent via-white/[0.03] via-white/[0.04] to-white/[0.02]"></div>
      <div className="container flex flex-row items-center lg:px-4 xl:px-8">
        <Example />
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
                  Get Link
                </MenuItem>
                <MenuItem onClick={() => {}}>Visibility Settings</MenuItem>
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
                <MenuItem onClick={() => {}}>Save to Move-trainer</MenuItem>
                <MenuItem onClick={() => {}}>Save as New Analysis</MenuItem>
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
                <MenuItem onClick={() => {}}>Eval Settings</MenuItem>
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
          } group flex flex-row w-full  px-2 py-2 text-sm ${disabled ? "pointer-none text-white/[0.3]" : ""}`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}
