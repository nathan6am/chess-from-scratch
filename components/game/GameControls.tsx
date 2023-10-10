import React, { useContext } from "react";
import { GameContext } from "../GameOnline";
import { FaHandshake, FaCheck } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { GameControls as IGameControls } from "@/hooks/useChessOnline";
import { FiRepeat, FiFlag } from "react-icons/fi";
import Button from "../UIKit/Button";
interface Props {
  gameControls: IGameControls;
  flipBoard: () => void;
  className?: string;
  size: "sm" | "lg";
}
export default function GameControls({}: Props) {
  const { onlineGame } = useContext(GameContext);
  const { gameControls, drawOfferRecieved, drawOfferSent } = onlineGame;
  return (
    <div className="grid grid-cols-2 w-full p-4 gap-4 bg-elevation-2">
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
            size="lg"
          ></Button>
          <Button
            variant="neutral"
            onClick={() => {
              gameControls.acceptDraw(true);
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
              size="lg"
            >
              <>
                Offer Draw <FaHandshake className={`inline`} />
              </>
            </Button>
          )}
          <Button
            onClick={gameControls.resign}
            label="Resign"
            icon={FiFlag}
            iconClassName="mr-1"
            variant="danger"
            size="lg"
            outline
          ></Button>
        </>
      )}
    </div>
  );
}
