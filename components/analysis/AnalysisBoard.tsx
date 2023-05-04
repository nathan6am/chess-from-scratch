import React, { useState, useRef, Fragment, useContext, useMemo, useCallback, useEffect } from "react";
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
import { BoardHandle } from "../game/Board";
import { SettingsContext } from "@/context/settings";
import useSavedAnalysis from "@/hooks/useSavedAnalysis";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import { tagDataToPGNString } from "@/util/parsers/pgnParser";
import { useRouter } from "next/router";

interface Props {
  initialId?: string | null;
  sourceGameId?: string | null;
  sourceGameType?: "masters" | "lichess" | null;
  fromFen?: string;
}
export default function AnalysisBoard({ initialId, sourceGameId, sourceGameType }: Props) {
  const analysis = useAnalysisBoard();
  const boardRef = useRef<BoardHandle>(null);
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
    markupControls,
  } = analysis;
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const currentIdRef = useRef<string | null | undefined>(id);
  const initialLoad = useRef(initialId || sourceGameId ? false : true);
  const saveManager = useSavedAnalysis();
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const { settings } = useContext(SettingsContext);
  const [saveModalShown, setSaveModalShown] = useState(false);
  const [popupPlayerShown, setPopupPlayerShown] = useState(false);
  const [optionsOverlayShown, setOptionsOverlayShown] = useState(false);
  const lastMoveAnnotation = useMemo(() => {
    return currentNode?.data.annotations.find((code) => code >= 1 && code <= 7);
  }, [currentNode, currentNode?.data.annotations]);

  useEffect(() => {
    if (id) return;
    if (!sourceGameId) return;
    if (initialLoad.current) return;
    if (!sourceGameType) {
      initialLoad.current = true;
      return;
    }
    console.log(sourceGameId, sourceGameType);
    analysis.explorer
      .fetchGameAsync(sourceGameId, sourceGameType)
      .then((game) => {
        initialLoad.current = true;
        if (!game) return;
        analysis.loadPgn(game);
      })
      .catch((e) => {
        initialLoad.current = true;
        console.error(e);
      });
  }, [sourceGameId, sourceGameType, initialLoad, analysis, id]);

  useEffect(() => {
    if (!id) return;
    if (!saveManager.data?.analysis) return;
    if (!initialLoad.current) {
      console.log("initial load");
      analysis.loadPgn(saveManager.data.analysis.pgn);
      initialLoad.current = true;
      currentIdRef.current = id;
      return;
    }
    if (id === currentIdRef.current) return;
    //Only load if the id was changed from null/undefined (prevents reloading on saving)
    if (currentIdRef.current) {
      analysis.loadPgn(saveManager.data.analysis.pgn);
    }
    currentIdRef.current = id;
  }, [id, currentIdRef, saveManager.data, analysis.loadPgn, initialLoad]);
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
        pgn={explorer.otbGame?.pgn || ""}
        link={
          explorer.otbGame ? `/study/analyze?gameId=${explorer.otbGame.id}&sourceType=${explorer.otbGame.type}` : ""
        }
        closePlayer={() => {
          setPopupPlayerShown(false);
        }}
      />
      <SaveAnalysis
        moveText={moveText}
        save={saveManager.saveNew}
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
              <Board
                overrideArrows={currentNode?.data ? true : false}
                onArrow={markupControls.onArrow}
                onMarkSquare={markupControls.onMarkSquare}
                onClear={markupControls.onClear}
                arrows={currentNode?.data.arrows}
                markedSquares={currentNode?.data.markedSquares}
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
                markupColor={markupControls.arrowColor}
                onPremove={() => {}}
              />
            </BoardColumn>
            {evalEnabled && (
              <EvalBar
                scoreType={evaler.currentScore.type}
                value={evaler.currentScore.value}
                orientation={orientation}
                scale={9.06}
                key={orientation}
              />
            )}
          </div>

          <PanelColumnLg className="bg-[#1f1f1f]">
            <AnalysisPanel
              analysis={analysis}
              boardRef={boardRef}
              showPlayer={() => {
                setPopupPlayerShown(true);
              }}
            />
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
          } group flex flex-row w-full  px-2 py-2 text-sm ${disabled ? "pointer-none text-white/[0.3]" : ""}`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}
