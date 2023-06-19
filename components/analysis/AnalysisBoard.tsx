import React, { useState, useRef, Fragment, useContext, useMemo, useEffect } from "react";

// Components
import Board from "../game/Board";
import EvalBar from "./EvalBar";
import BoardControls from "../game/BoardControls";
import OptionsOverlay from "../UI/dialogs/OptionsOverlay";
import { BoardRow, BoardColumn, PanelColumnLg } from "../layout/GameLayout";
import PopupPlayer from "./PopupPlayer";
import SaveAnalysis from "../UI/dialogs/SaveAnalysis";
import AnalysisPanel from "./AnalysisPanel";
import { Menu, Transition } from "@headlessui/react";
import { BoardHandle } from "../game/Board";

//Icons
import { IoMdStopwatch } from "react-icons/io";
// Hooks
import useSavedAnalysis from "@/hooks/useSavedAnalysis";
import useAnalysisBoard, { AnalysisHook } from "@/hooks/useAnalysisBoard";
import { useRouter } from "next/router";
import useBoardEditor from "@/hooks/useBoardEditor";
// Context
import { SettingsContext } from "@/context/settings";

// Utils
import { tagDataToPGNString } from "@/util/parsers/pgnParser";
import * as Chess from "@/lib/chess";
import classNames from "classnames";
import { Duration } from "luxon";
import axios from "axios";
import Toggle from "../UI/Toggle";
import NewAnalysisPanel from "./NewAnalysisPanel";

interface Props {
  initialId?: string | null;
  sourceGameId?: string | null;
  sourceGameType?: "masters" | "lichess" | "nextchess" | null;
  fromFen?: string;
}

interface Context {
  analysis: AnalysisHook;
  boardRef: React.RefObject<BoardHandle>;
  boardEditor: ReturnType<typeof useBoardEditor>;
}

export const AnalysisContext = React.createContext<Context>(null!);

export default function AnalysisBoard({ initialId, sourceGameId, sourceGameType }: Props) {
  const analysis = useAnalysisBoard();
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
    pgn,
    tagData,
  } = analysis;
  const boardRef = useRef<BoardHandle>(null);
  const { settings } = useContext(SettingsContext);
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const editor = useBoardEditor(currentGame.fen);
  // Handle id changes/initial load
  const id = router.query.id as string | undefined;
  const currentIdRef = useRef<string | null | undefined>(id);
  const initialLoad = useRef(initialId || sourceGameId ? false : true);
  const saveManager = useSavedAnalysis({ pgn, tags: tagData });

  // Display state
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const flipBoard = () => {
    setOrientation((cur) => (cur === "w" ? "b" : "w"));
  };
  const [saveModalShown, setSaveModalShown] = useState(false);
  const [popupPlayerShown, setPopupPlayerShown] = useState(false);
  const [optionsOverlayShown, setOptionsOverlayShown] = useState(false);
  const lastMoveAnnotation = useMemo(() => {
    return currentNode?.data.annotations.find((code) => code >= 1 && code <= 7);
  }, [currentNode, currentNode?.data.annotations]);

  // Fetch source game on initial load
  useEffect(() => {
    if (id) return;
    if (!sourceGameId) return;
    if (initialLoad.current) return;
    if (!sourceGameType) {
      initialLoad.current = true;
      return;
    }
    if (sourceGameType === "nextchess") {
      console.log("fetching nextchess game");
      axios.get(`/api/game/pgn/${sourceGameId}`).then((res) => {
        initialLoad.current = true;
        if (!res.data) return;
        analysis.loadPgn(res.data);
      });
    } else {
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
    }
  }, [sourceGameId, sourceGameType, initialLoad, analysis, id]);

  // Load saved analysis on initial load and id change
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
    <AnalysisContext.Provider
      value={{
        analysis,
        boardRef,
        boardEditor: editor,
      }}
    >
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
          explorer.otbGame
            ? `/study/analyze?gameId=${explorer.otbGame.id}&sourceType=${explorer.otbGame.type}`
            : ""
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
        <span>Synced: {`${saveManager.synced}`}</span>
        <BoardRow>
          <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
            <BoardColumn className="items-center relative">
              <>
                <div className="absolute top-[-2em] bottom-[-2em] flex flex-row w-inherit">
                  <div className="flex flex-col justify-between items-center shrink">
                    <>
                      {analysis.tagData.black && (
                        <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                          {analysis.tagData.black}{" "}
                          <span className="inline opacity-50">{`(${
                            analysis.tagData.eloBlack || "?"
                          })`}</span>
                        </p>
                      )}
                    </>
                    <>
                      {analysis.tagData.white && (
                        <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                          {analysis.tagData.white}{" "}
                          <span className="inline opacity-50">{`(${
                            analysis.tagData.eloWhite || "?"
                          })`}</span>
                        </p>
                      )}
                    </>
                  </div>
                  <div className="flex flex-col justify-between items-center shrink">
                    <span>
                      {analysis.timeRemaining.b !== null && (
                        <DisplayClock time={analysis.timeRemaining.b} color="b" />
                      )}
                    </span>
                    <span>
                      {analysis.timeRemaining.w !== null && (
                        <DisplayClock time={analysis.timeRemaining.w} color="w" />
                      )}
                    </span>
                  </div>
                </div>
              </>
              {/* <>
                {analysis.tagData.white && (
                  <div
                    className={classNames("absolute flex flex-row justify-between items-baseline w-full", {
                      "top-[-2em]": orientation === "b",
                      "bottom-[-2em]": orientation === "w",
                    })}
                  >
                    <p className={classNames(" p-1 px-4 bg-white/[0.1]")}>
                      {analysis.tagData.white}{" "}
                      <span className="inline opacity-50">{`(${analysis.tagData.eloWhite || "?"})`}</span>
                    </p>
                    <>
                      {analysis.timeRemaining.w !== null && <DisplayClock time={analysis.timeRemaining.w} color="w" />}
                    </>
                  </div>
                )}
              </> */}
              {/* <>
                {analysis.tagData.white && (
                  <p
                    className={classNames("absolute p-1 px-4 bg-white/[0.1]", {
                      "top-[-2em]": orientation === "w",
                      "bottom-[-2em]": orientation === "b",
                    })}
                  >
                    {analysis.tagData.black}{" "}
                    <span className="inline opacity-50">{`(${analysis.tagData.eloBlack || "?"})`}</span>
                  </p>
                )}
              </> */}
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
                showHighlights={editMode ? false : settings.display.showHighlights}
                showTargets={editMode ? false : settings.display.showValidMoves}
                pieces={editMode ? editor.board : currentGame.board}
                animationSpeed={settings.display.animationSpeed}
                lastMove={editMode ? null : currentGame.lastMove}
                activeColor={currentGame.activeColor}
                moveable={"both"}
                preMoveable={false}
                autoQueen={settings.gameBehavior.autoQueen}
                onMove={onMove}
                markupColor={markupControls.arrowColor}
                onPremove={() => {}}
                disableArrows={editMode}
                editMode={editMode}
                onMovePiece={editor.onMovePiece}
                onAddPiece={editor.onAddPiece}
                onRemovePiece={editor.onRemovePiece}
                pieceCursor={editor.pieceCursor}
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
            <>
              <>
                {analysis.isNew ? (
                  <NewAnalysisPanel
                    analysis={analysis}
                    boardEditor={editor}
                    boardRef={boardRef}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    flipBoard={flipBoard}
                  />
                ) : (
                  <>
                    <AnalysisPanel
                      showPlayer={() => {
                        setPopupPlayerShown(true);
                      }}
                    />
                    <BoardControls controls={boardControls} flipBoard={flipBoard} />
                  </>
                )}
              </>
            </>
          </PanelColumnLg>
        </BoardRow>
      </div>
    </AnalysisContext.Provider>
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

function DisplayClock({ time, color }: { time: number; color: Chess.Color }) {
  const duration = Duration.fromMillis(time);

  return (
    <div
      className={classNames("p-1 px-4 flex flex-row items-center justify-center", {
        "bg-[#919191] text-black/[0.7]": color === "w",
        "bg-black text-white": color === "b",
      })}
    >
      <IoMdStopwatch className="mr-2" />
      {duration.toFormat("hh:mm:ss")}
    </div>
  );
}
