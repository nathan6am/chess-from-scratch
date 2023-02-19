import { ApiResponse, MoveData } from "@/hooks/useOpeningExplorer";
import React, { useCallback, useRef, useMemo, useEffect } from "react";
import { ScrollContainer } from "../layout/GameLayout";
import Loading from "../UI/Loading";
import { parsePGN } from "../game/MoveHistory";
import * as Chess from "@/lib/chess";
import _ from "lodash";
interface Props {
  isLoading: boolean;
  error: unknown;
  data: ApiResponse | undefined;
  currentGame: Chess.Game;
  onMove: (move: Chess.Move) => void;
}
export default function Explorer({ data, error, isLoading, currentGame, onMove }: Props) {
  const attemptMove = useCallback(
    (san: string) => {
      const move = currentGame.legalMoves.find((move) => move.PGN === san);
      if (move) onMove(move);
    },
    [onMove, currentGame]
  );

  const prevOpening = useRef<{ name: string; eco: string } | null>(null);
  useEffect(() => {
    if (!data) return;
    if (data.opening && !_.isEqual(data.opening, prevOpening)) {
      prevOpening.current = data.opening;
    }
  }, [data]);
  const opening = useMemo(() => {
    return data?.opening || prevOpening.current;
  }, [data]);
  return (
    <div className="w-full h-[400px] flex flex-col">
      <div className="w-full p-2 px-3 text-md bg-[#202020] shadow-md">
        {`Opening: ${opening?.name || "Starting Position"}`}
        <span className="inline text-sepia/[0.8]">{`${opening?.eco ? ` (${opening.eco})` : ""}`}</span>
      </div>
      <div className="w-full grow relative">
        <ScrollContainer>
          <>
            {(error || (!data && !isLoading)) && <p>Unable to reach database</p>}
            {(isLoading || (!data && !error)) && (
              <>
                <Loading />
              </>
            )}
            {data && !isLoading && (
              <>
                {data.moves.map((moveData) => (
                  <RenderMoveRow attemptMove={attemptMove} moveData={moveData} key={moveData.uci} />
                ))}
              </>
            )}
          </>
        </ScrollContainer>
        <div className="bottom-0 left-0 right-0 absolute h-6 bg-gradient-to-b from-transparent to-[#121212]/[0.5]"></div>
      </div>
    </div>
  );
}

interface MoveRowProps {
  moveData: MoveData;
  attemptMove: (san: string) => void;
}
function RenderMoveRow({ moveData, attemptMove }: MoveRowProps) {
  const notation = parsePGN(moveData.san, "w");
  const totalGames = moveData.white + moveData.black + moveData.draws;
  return (
    <div className="w-full flex flex-row py-1 pr-2 border-b border-white/[0.2]">
      <div className="w-40 flex flex-row items-center px-2">
        <button
          onClick={() => {
            attemptMove(moveData.san);
          }}
          className="text-sm px-2 py-1 bg-white/[0.1] hover:bg-white/[0.2] rounded-sm w-[48px] mr-2 text-center"
        >
          {notation}
        </button>
        <p className="text-xs ">{totalGames}</p>
      </div>
      <PercentageBar total={totalGames} black={moveData.black} draws={moveData.draws} white={moveData.white} />
    </div>
  );
}

interface BarProps {
  total: number;
  white: number;
  black: number;
  draws: number;
}
function PercentageBar({ total, white, black, draws }: BarProps) {
  return (
    <div className="w-full flex flex-row overflow-hidden rounded-sm border border-white/[0.1]">
      {white > 0 && (
        <div
          className="bg-white text-black text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((white / total) * 100)}%` }}
        >
          <p>{`${Math.round((white / total) * 100) > 1 ? `${Math.round((white / total) * 100)}%` : white}`}</p>
        </div>
      )}
      {draws > 0 && (
        <div
          className="bg-[#363636] text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((draws / total) * 100)}%` }}
        >{`${Math.round((draws / total) * 100) > 1 ? `${Math.round((draws / total) * 100)}%` : draws}`}</div>
      )}
      {black > 0 && (
        <div
          className="bg-black grow text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((black / total) * 100)}%` }}
        >{`${Math.round((black / total) * 100) > 1 ? `${Math.round((black / total) * 100)}%` : black}`}</div>
      )}
    </div>
  );
}

function Placeholder() {}
