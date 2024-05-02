import React, { useContext, useCallback } from "react";
import { encodeGameToPgn } from "@/util/parsers/pgnParser";
import { GameContext } from "../GameOnline";
import { FaHandshake, FaCheck } from "react-icons/fa";
import { MdClose, MdAnalytics } from "react-icons/md";
import { GameControls as IGameControls } from "@/hooks/useChessOnline";
import { FiRepeat, FiFlag } from "react-icons/fi";
import { Button } from "../base";
import { useRouter } from "next/router";
import ConfirmationDialog from "../dialogs/ConfirmationDialog";
import { useState } from "react";
import useGameCache from "@/hooks/cache/useGameCache";
interface Props {
  gameControls: IGameControls;
  flipBoard: () => void;
  className?: string;
  size: "sm" | "lg";
}
export default function GameControls({}: Props) {
  const { onlineGame } = useContext(GameContext);
  const { gameControls, drawOfferRecieved, drawOfferSent, gameStatus } = onlineGame;
  return (
    <div className="grid grid-cols-2 w-full px-4 gap-x-4 bg-elevation-2 py-2">
      {gameStatus === "complete" ? (
        <>
          <PostGameControls />
        </>
      ) : (
        <InGameControls />
      )}
    </div>
  );
}

function PostGameControls() {
  const router = useRouter();
  const { onlineGame } = useContext(GameContext);
  const { cacheGame } = useGameCache();
  const { gameControls, drawOfferRecieved, drawOfferSent, gameStatus, currentGame, rematchOffer } = onlineGame;
  const gameid = currentGame?.id;
  const [declined, setDeclined] = useState(false);
  const onAnalyze = useCallback(() => {
    if (!currentGame) return;
    const pgn = encodeGameToPgn(currentGame);
    cacheGame(pgn, "1");
    router.push("/study/analyze?gameId=1&sourceType=last");
  }, [router, cacheGame, currentGame, encodeGameToPgn]);
  return (
    <>
      {rematchOffer === "recieved" && !declined ? (
        <>
          <div className="col-span-2">
            <p className="text-sm text-light-300 text-center">Your opponent wants a rematch!</p>
          </div>
          <Button
            variant="neutral"
            onClick={() => {
              setDeclined(true);
            }}
            label="Decline"
            icon={MdClose}
            iconClassName="mr-1"
            size="lg"
          ></Button>
          <Button
            variant="neutral"
            onClick={() => {
              gameControls.requestRematch();
            }}
            label="Accept"
            icon={FaCheck}
            iconClassName="mr-1"
            size="lg"
          ></Button>
        </>
      ) : (
        <>
          {" "}
          <Button
            variant="neutral"
            onClick={onAnalyze}
            label="Analyze Game"
            icon={MdAnalytics}
            iconClassName="mr-1"
          ></Button>
          {rematchOffer === "offered" ? (
            <div className="h-full w-full flex justify-center items-center text-center">
              <p className="text-sm text-light-300">
                <em>Rematch offer sent</em>
              </p>
            </div>
          ) : (
            <Button 
              variant="neutral"
              onClick={() => {
                gameControls.requestRematch();
              }}
              label="Rematch"
              icon={FaCheck}
              iconClassName="mr-1"
            ></Button>
          )}
        </>
      )}
    </>
  );
}

function InGameControls() {
  const { onlineGame } = useContext(GameContext);
  const { gameControls, drawOfferRecieved, drawOfferSent, gameStatus } = onlineGame;
  return (
    <>
      {drawOfferRecieved ? (
        <>
          <div className="col-span-2">
            <p className="text-sm text-light-300 text-center">Opponent offered a draw.</p>
          </div>
          <Button
            variant="neutral"
            onClick={() => {
              gameControls.acceptDraw(false);
            }}
            label="Decline"
            icon={MdClose}
            iconClassName="mr-1"
          ></Button>
          <Button
            variant="neutral"
            onClick={() => {
              gameControls.acceptDraw(true);
            }}
            label="Accept"
            icon={FaCheck}
            iconClassName="mr-1"
          ></Button>
        </>
      ) : (
        <>
          {" "}
          {drawOfferSent ? (
            <div className="h-full w-full flex justify-center items-center text-center">
              <p className="text-sm text-light-300">
                <em>Draw offer sent</em>
              </p>
            </div>
          ) : (
            <Button
              variant="neutral"
              onClick={gameControls.offerDraw}
              label="Offer Draw"
              icon={FaHandshake}
              iconClassName="mr-1"
            >
              <>
                Offer Draw <FaHandshake className={`inline`} />
              </>
            </Button>
          )}
          <ResignButton
            onResign={gameControls.resign}
            label={gameStatus === "active" ? "Resign" : "Abort"}
          ></ResignButton>
        </>
      )}
    </>
  );
}

function ResignButton({ onResign, label }: { onResign: () => void; label: string }) {
  const [dialogShown, setDialogShown] = useState(false);
  return (
    <>
      <ConfirmationDialog
        title="Resign Game"
        message="Are you sure you want to resign?"
        onConfirm={onResign}
        isOpen={dialogShown}
        onCancel={() => setDialogShown(false)}
        closeModal={() => {
          setDialogShown(false);
        }}
        confirmText="Resign"
        cancelText="Keep Playing"
      />
      <Button
        onClick={() => setDialogShown(true)}
        icon={FiFlag}
        label={label}
        iconClassName="mr-1"
        variant="neutral"
      ></Button>
    </>
  );
}
