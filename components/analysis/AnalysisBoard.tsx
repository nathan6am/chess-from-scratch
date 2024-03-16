import React, { useState, useRef, Fragment, useContext, useMemo, useEffect } from "react";

// Components
import Board from "../game/Board";
import EvalBar from "./EvalBar";
import BoardControls from "../game/BoardControls";
import OptionsOverlay from "../UI/dialogs/OptionsOverlay";
import { BoardRow, BoardColumn, PanelColumnLg } from "../layout/GameLayout";
import PopupPlayer from "./PopupPlayer";
import SaveAnalysis from "../UI/dialogs/SaveAnalysis";
import AnalysisPanel from "./panels/AnalysisPanel";

import { BoardHandle } from "../game/Board";
import MenuBar from "@/components/layout/MenuBar";
import { MenuWrapper, MenuItems, MenuItem, MenuButton } from "../UIKit/ToolMenu";
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
import NewAnalysisPanel from "./panels/NewAnalysisPanel";
import Link from "next/link";
import OpenAnalysisDialog from "../dialogs/OpenAnalysisDialog";
import { set } from "lodash";
import ExportPGNDialog from "../dialogs/ExportPGNDialog";

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
  saveManager: ReturnType<typeof useSavedAnalysis>;
}

export const AnalysisContext = React.createContext<Context>(null!);

export default function AnalysisBoard({ initialId, sourceGameId, sourceGameType }: Props) {
  const analysis = useAnalysisBoard({
    isNew: initialId || sourceGameId ? false : true,
  });
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
  const currentIdRef = useRef<string | null | undefined>(undefined);
  const initialLoad = useRef(initialId || sourceGameId ? false : true);
  const [preSave, setPreSave] = useState(false);
  const saveManager = useSavedAnalysis({
    pgn,
    tags: tagData,
    shouldSync: analysis.pgnLoaded,
    loadedId: analysis.treeId,
    onSaveNew: () => {
      setPreSave(true);
    },
    onDidSaveNew: (data) => {
      setSaveModalShown(false);
      analysis.tree.setTreeId(data.id);
    },
  });

  // Display state
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const flipBoard = () => {
    setOrientation((cur) => (cur === "w" ? "b" : "w"));
  };
  const [saveModalShown, setSaveModalShown] = useState(false);
  const [openModalShown, setOpenModalShown] = useState(false);
  const [popupPlayerShown, setPopupPlayerShown] = useState(false);
  const [optionsOverlayShown, setOptionsOverlayShown] = useState(false);
  const [exportModalShown, setExportModalShown] = useState(false);
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
    if (!id) {
      currentIdRef.current = null;
      return;
    }
    if (!saveManager.data?.analysis) return;
    if (id === currentIdRef.current) return;
    //Only load if the id was changed from null/undefined (prevents reloading on saving)
    if (!preSave) {
      analysis.loadPgn(saveManager.data.analysis.pgn, id);
      setOpenModalShown(false);
    } else {
      setPreSave(false);
    }
    currentIdRef.current = id;
  }, [id, currentIdRef, saveManager.data, analysis.loadPgn, initialLoad, preSave]);

  return (
    <AnalysisContext.Provider
      value={{
        analysis,
        boardRef,
        boardEditor: editor,
        saveManager,
      }}
    >
      <ExportPGNDialog
        fileName={saveManager.data?.analysis?.title || "analysis"}
        isOpen={exportModalShown}
        onClose={() => {
          setExportModalShown(false);
        }}
      />
      <OpenAnalysisDialog isOpen={openModalShown} onClose={() => setOpenModalShown(false)} />
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
      <div className="flex flex-col h-full w-full justify-center ">
        <MenuBar>
          <MenuWrapper>
            <MenuButton>File</MenuButton>
            <MenuItems>
              <MenuItem
                onClick={() => {
                  router.push(
                    {
                      pathname: "/study/analyze",
                      query: {},
                    },
                    undefined,
                    { shallow: true }
                  );
                  analysis.reset({});
                }}
              >
                New Analysis
              </MenuItem>

              <MenuItem onClick={() => setSaveModalShown(true)} disabled={!!saveManager.id}>
                {saveManager.id && saveManager.data?.analysis ? (
                  <span className="block truncate">{`Saved as "${saveManager.data?.analysis?.title}"`}</span>
                ) : (
                  <>Save</>
                )}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpenModalShown(true);
                }}
              >
                Open
              </MenuItem>
              <MenuItem onClick={() => {}}>Fork</MenuItem>
              <MenuItem onClick={() => {}}>Import PGN</MenuItem>
              <MenuItem onClick={() => {}}>Add to Collections</MenuItem>
              <MenuItem onClick={() => setPopupPlayerShown(true)}>Load Game</MenuItem>
            </MenuItems>
          </MenuWrapper>
          <MenuWrapper>
            <MenuButton>Edit</MenuButton>
            <MenuItems>
              <MenuItem onClick={() => {}}>Undo</MenuItem>
              <MenuItem onClick={() => {}}>Redo</MenuItem>
              <MenuItem onClick={() => {}}>Delete from Here</MenuItem>
              <MenuItem onClick={() => {}}>Promote Variation</MenuItem>
              <MenuItem onClick={() => {}}>Make Mainline</MenuItem>
              <MenuItem onClick={() => {}}>Delete Variations</MenuItem>
              <MenuItem onClick={() => {}}>Edit PGN Tags</MenuItem>
            </MenuItems>
          </MenuWrapper>
          <MenuWrapper>
            <MenuButton>Share/Export</MenuButton>
            <MenuItems>
              <MenuItem onClick={() => {}}>Share</MenuItem>
              <MenuItem
                onClick={() => {
                  setExportModalShown(true);
                }}
              >
                Export PGN
              </MenuItem>
              <MenuItem onClick={() => {}}>Export FEN</MenuItem>
              <MenuItem onClick={() => {}}>Export Image</MenuItem>
              <MenuItem onClick={() => {}}>Export GIF</MenuItem>
            </MenuItems>
          </MenuWrapper>
          <MenuWrapper>
            <MenuButton>Position</MenuButton>
            <MenuItems>
              <MenuItem onClick={() => setEditMode((cur) => !cur)}>Edit Board</MenuItem>
              <MenuItem onClick={() => {}}>Play vs. Computer</MenuItem>
              <MenuItem onClick={() => {}}>Play vs. a Friend</MenuItem>
              <MenuItem onClick={() => {}}>Copy FEN</MenuItem>
              <MenuItem onClick={flipBoard}>Flip Board</MenuItem>
            </MenuItems>
          </MenuWrapper>
        </MenuBar>

        <BoardRow>
          <div className="flex flex-row w-full lg:h-fit lg:basis-[100vh] justify-center md:pl-4">
            <BoardColumn className="items-center relative">
              <>
                <div className="absolute top-[-2em] bottom-[-2em] flex flex-row justify-center w-inherit">
                  <div
                    className={classNames("flex justify-between items-center shrink", {
                      "flex-col": orientation === "w",
                      "flex-col-reverse": orientation === "b",
                    })}
                  >
                    <>
                      {analysis.tagData.black && (
                        <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                          {analysis.tagData.black}{" "}
                          <span className="inline opacity-50">{`(${analysis.tagData.eloBlack || "?"})`}</span>
                        </p>
                      )}
                    </>
                    <>
                      {analysis.tagData.white && (
                        <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                          {analysis.tagData.white}{" "}
                          <span className="inline opacity-50">{`(${analysis.tagData.eloWhite || "?"})`}</span>
                        </p>
                      )}
                    </>
                  </div>
                  <div
                    className={classNames("flex justify-between items-center shrink", {
                      "flex-col": orientation === "w",
                      "flex-col-reverse": orientation === "b",
                    })}
                  >
                    <span>
                      {analysis.timeRemaining.b !== null && <DisplayClock time={analysis.timeRemaining.b} color="b" />}
                    </span>
                    <span>
                      {analysis.timeRemaining.w !== null && <DisplayClock time={analysis.timeRemaining.w} color="w" />}
                    </span>
                  </div>
                </div>
              </>
              <Board
                id="analysis-board"
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

          <PanelColumnLg className="bg-[#1f1f1f] mt-8 ">
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
                    <div className="w-full md:hidden">
                      <BoardControls controls={boardControls} flipBoard={flipBoard} />
                    </div>
                    <AnalysisPanel
                      modalControls={{
                        showPlayer: () => {
                          setPopupPlayerShown(true);
                        },
                        showSave: () => {
                          setSaveModalShown(true);
                        },
                        showLoadGame: () => {},
                        showEditDetails: () => {},
                        showOpenFile: () => {},
                        showShare: () => {},
                        showExport: () => {},
                      }}
                    />
                    <div className="w-full hidden md:block">
                      <BoardControls controls={boardControls} flipBoard={flipBoard} />
                    </div>
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
