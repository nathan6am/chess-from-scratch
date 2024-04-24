import React, { useState, useRef, useContext, useMemo, useEffect } from "react";

// Components
import Board, { BoardHandle } from "@/components/board/Board";
import EvalBar from "./EvalBar";
import BoardControls from "@/components/game/BoardControls";
import OptionsOverlay from "@/components/dialogs/OptionsOverlay";
import PopupPlayer from "./PopupPlayer";
import SaveAnalysis from "@/components/dialogs/SaveAnalysis";
import AnalysisPanel from "./panels/AnalysisPanel";
import PlayerDetails from "./PlayerDetails";
import {
  BoardWithPanelContainer,
  BoardContainer,
  BoardRow,
  PanelContainer,
} from "@/components/layout/templates/AnalysisBoardLayout";
import MenuBar from "@/components/layout/MenuBar";
import { MenuWrapper, MenuItems, MenuItem, MenuButton } from "../base/ToolMenu";
import { EditorPanel } from "./panels";
import ReadOnlyNotification from "./ReadOnlyNotification";

// Icons
import { MdOutlineEditOff, MdCancel } from "react-icons/md";
import { TbGitFork } from "react-icons/tb";

// Hooks
import useSavedAnalysis from "@/hooks/useSavedAnalysis";
import useAnalysisBoard, { AnalysisHook } from "@/hooks/analysis/useAnalysisBoard";
import { useRouter } from "next/router";
import useBoardEditor from "@/hooks/useBoardEditor";

// Context
import { SettingsContext } from "@/context/settings";

// Utils
import * as Chess from "@/lib/chess";
import NewAnalysisPanel from "./panels/NewAnalysisPanel";
import OpenAnalysisDialog from "../dialogs/OpenAnalysisDialog";
import ExportPGNDialog from "../dialogs/ExportPGNDialog";

import { useLoadFromSource } from "@/hooks/analysis";

interface Props {
  /**
   * Initial analysis id to load (from url)
   */
  initialId?: string | null;
  /**
   * Id of the game to load (from url)
   */
  sourceGameId?: string | null;
  /**
   * Type of the source game
   */
  sourceGameType?: "masters" | "lichess" | "nextchess" | "last" | "puzzle" | null;
  /**
   * FEN to load
   */
  fromFen?: string;
}

interface Context {
  analysis: AnalysisHook;
  boardRef: React.RefObject<BoardHandle>;
  boardEditor: ReturnType<typeof useBoardEditor>;
  saveManager: ReturnType<typeof useSavedAnalysis>;
  showModal: (key: "save" | "export" | "open") => void;
}

export const AnalysisContext = React.createContext<Context>(null!);

export default function AnalysisBoard({ initialId, sourceGameId, sourceGameType }: Props) {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  /**
   * Initialize analysis board and board editor
   */
  const analysis = useAnalysisBoard({
    isNew: initialId || sourceGameId ? false : true,
  });
  const {
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    boardControls,
    moveText,
    explorer,
    currentNode,
    markupControls,
    pgn,
    options: { showEvalBar, showBestMoveArrow },
    tagData,
  } = analysis;
  const boardRef = useRef<BoardHandle>(null);
  const editor = useBoardEditor(currentGame.fen);

  /**
   * Load settings from context
   */
  const { settings } = useContext(SettingsContext);

  //Internal State
  const [editMode, setEditMode] = useState(false);
  const currentIdRef = useRef<string | null | undefined>(undefined);
  const initialLoad = useRef(initialId || sourceGameId ? false : true);
  const [preSave, setPreSave] = useState(false);

  // Save manager
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
  const { readonly } = saveManager;

  const [saveModalShown, setSaveModalShown] = useState(false);
  const [openModalShown, setOpenModalShown] = useState(false);
  const [popupPlayerShown, setPopupPlayerShown] = useState(false);
  const [optionsOverlayShown, setOptionsOverlayShown] = useState(false);
  const [exportModalShown, setExportModalShown] = useState(false);

  // Load from source
  useLoadFromSource({
    id,
    sourceGameId,
    sourceGameType,
    initialLoad,
    analysis,
  });

  //Readonly banner notification
  const [readonlyVisible, setReadonlyVisible] = useState(readonly);
  useEffect(() => {
    if (readonly) {
      setReadonlyVisible(true);
    } else {
      setReadonlyVisible(false);
    }
  }, [readonly]);

  //Last move annotation to display
  const lastMoveAnnotation = useMemo(() => {
    return currentNode?.data.annotations.find((code) => code >= 1 && code <= 7);
  }, [currentNode?.data.annotations]);

  //Board orientation
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const flipBoard = () => {
    setOrientation((cur) => (cur === "w" ? "b" : "w"));
  };

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
        showModal: (key) => {
          switch (key) {
            case "save":
              setSaveModalShown(true);
              break;
            case "export":
              setExportModalShown(true);
              break;
            case "open":
              setOpenModalShown(true);
              break;
            default:
              return;
          }
        },
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
      <BoardWithPanelContainer>
        <ReadOnlyNotification>
          <>
            {readonlyVisible && (
              <div className="w-lg flex flex-row space-around items-center text-sm bg-[#3498db] p-3 max-w-[600px] pointer-events-auto">
                <MdOutlineEditOff className="text-lg mr-1" />
                {`This analysis is in readonly mode.`}
                {
                  <>
                    <button
                      onClick={saveManager.unLink}
                      className="py-1 px-2 mx-1 rounded-md bg-[#2774a7] hover:bg-[#1b5074]"
                    >
                      <TbGitFork className="inline mr-0.5" />
                      Fork Locally to Edit
                    </button>
                  </>
                }

                <button
                  className="mx-2 text-white/[0.7] hover:text-white"
                  onClick={() => {
                    setReadonlyVisible(false);
                  }}
                >
                  Dismiss <MdCancel className="inline ml-[2px]" />
                </button>
              </div>
            )}
          </>
        </ReadOnlyNotification>
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
              {/* <MenuItem onClick={() => {}}>Fork</MenuItem>
              <MenuItem onClick={() => {}}>Import PGN</MenuItem>
              <MenuItem onClick={() => {}}>Add to Collections</MenuItem>
              <MenuItem onClick={() => setPopupPlayerShown(true)}>Load Game</MenuItem> */}
            </MenuItems>
          </MenuWrapper>
          <MenuWrapper>
            <MenuButton>Edit</MenuButton>
            <MenuItems>
              {/* <MenuItem onClick={() => {}}>Undo</MenuItem>
              <MenuItem onClick={() => {}}>Redo</MenuItem> */}
              <MenuItem
                onClick={() => {
                  if (currentNode) analysis.tree.deleteVariation(currentNode?.key);
                }}
              >
                Delete from Here
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (currentNode) analysis.tree.promoteVariation(currentNode?.key);
                }}
              >
                Promote Variation
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (currentNode) analysis.tree.promoteToMainline(currentNode?.key);
                }}
              >
                Make Mainline
              </MenuItem>
              {/* <MenuItem onClick={() => {}}>Edit PGN Tags</MenuItem> */}
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
              {/* <MenuItem onClick={() => {}}>Export FEN</MenuItem>
              <MenuItem onClick={() => {}}>Export Image</MenuItem>
              <MenuItem onClick={() => {}}>Export GIF</MenuItem> */}
            </MenuItems>
          </MenuWrapper>
          <MenuWrapper>
            <MenuButton>Position</MenuButton>
            <MenuItems>
              <MenuItem onClick={() => setEditMode(true)}>Edit Board</MenuItem>
              {/* <MenuItem onClick={() => {}}>Play vs. Computer</MenuItem>
              <MenuItem onClick={() => {}}>Play vs. a Friend</MenuItem>
              <MenuItem onClick={() => {}}>Copy FEN</MenuItem> */}
              <MenuItem onClick={flipBoard}>Flip Board</MenuItem>
            </MenuItems>
          </MenuWrapper>
        </MenuBar>

        <BoardRow>
          <PlayerDetails orientation={orientation} />
          <BoardContainer>
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
              moveable={readonly ? "none" : "both"}
              preMoveable={false}
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={onMove}
              markupColor={markupControls.arrowColor}
              onPremove={() => {}}
              bestMove={evalEnabled ? analysis.bestMove || undefined : undefined}
              showBestMoveArrow={showBestMoveArrow}
              disableArrows={editMode}
              editMode={editMode}
              onMovePiece={editor.onMovePiece}
              onAddPiece={editor.onAddPiece}
              onRemovePiece={editor.onRemovePiece}
              pieceCursor={editor.pieceCursor}
            />
          </BoardContainer>

          <>
            {evalEnabled && showEvalBar && (
              <EvalBar
                scoreType={evaler.currentScore.type}
                value={evaler.currentScore.value}
                orientation={orientation}
                scale={9.06}
                key={orientation}
              />
            )}
          </>
        </BoardRow>

        <PanelContainer>
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
                  {editMode ? (
                    <>
                      <EditorPanel
                        showOverwriteWarning={!analysis.isNew}
                        boardEditor={editor}
                        boardRef={boardRef}
                        onAnalyze={(fen: string) => {
                          analysis.loadFen(fen);
                          setEditMode(false);
                        }}
                        onPlayComputer={() => {}}
                        onPlayFriend={() => {}}
                        setEditMode={setEditMode}
                        flipBoard={flipBoard}
                      />
                    </>
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
              )}
            </>
          </>
        </PanelContainer>
      </BoardWithPanelContainer>
    </AnalysisContext.Provider>
  );
}
