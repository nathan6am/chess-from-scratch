import React, { useMemo } from "react";
import { useContextMenu, Menu, ItemParams, Item, Separator } from "react-contexify";
import type User_Game from "@/lib/db/entities/User_Game";
import { MdArrowDropDown, MdArrowDropUp, MdTimer } from "react-icons/md";
import { ImMinus } from "react-icons/im";
import { IoMdMore } from "react-icons/io";
import * as Chess from "@/lib/chess";
import { ScrollContainer } from "../layout/GameLayout";
import { useRouter } from "next/router";
interface ItemProps {
  usergame: User_Game;
}

interface Player {
  username: string | null;
  rating?: number;
  id?: string;
  isComputer?: boolean;
}

export default function GameList({ usergames }: { usergames: User_Game[] }) {
  const { show } = useContextMenu({
    id: "game-context-menu",
  });
  const showContextMenu = (e: React.MouseEvent, usergame: User_Game) => {
    e.preventDefault();
    show({ event: e, props: { usergame } });
  };
  return (
    <>
      <div className="w-full h-full grow relative">
        <GameContextMenu />
        <ScrollContainer>
          <table className="w-full">
            <thead className="top-0 sticky border-b bg-elevation-3 border-light-400/[0.1]">
              <tr>
                <th className="w-[1rem]"></th>
                <th className="text-xs text-left text-light-400 w-20 pl-0 py-1">Players</th>
                <th className="text-xs text-left text-light-400 w-16 ">Result</th>
                <th className="text-xs text-left text-light-400 w-[6rem]">Date</th>
                <th className="text-xs text-left text-light-400 w-10">
                  <MdTimer />
                </th>
                <th className="text-xs text-left text-light-400 w-[5rem] pr-4">Moves</th>
              </tr>
            </thead>
            <tbody>
              {usergames &&
                usergames.map((game) => {
                  return (
                    <RenderGame
                      key={game.id}
                      game={game as User_Game}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        showContextMenu(e, game);
                      }}
                    />
                  );
                })}
            </tbody>
          </table>
        </ScrollContainer>
      </div>
    </>
  );
}

function GameContextMenu() {
  const router = useRouter();
  function handleItemClick({ id, event, props }: ItemParams<ItemProps, any>) {
    const gameid = props?.usergame?.game.id;
    switch (id) {
      case "view":
        console.log(gameid);
        break;
      case "export":
        console.log(gameid);
        break;
      case "analyze":
        router.push(`/study/analyze?gameId=${gameid}&sourceType=nextchess`);
        break;
      default:
        break;
    }
  }
  return (
    <Menu id="game-context-menu" theme="dark" animation="fade">
      <Item id="view" onClick={handleItemClick}>
        View
      </Item>
      <Item id="export" onClick={handleItemClick}>
        Export
      </Item>
      <Item id="analyze" onClick={handleItemClick}>
        Analyze
      </Item>
    </Menu>
  );
}

function RenderGame({
  game: userGame,
  onContextMenu,
}: {
  game: User_Game;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const playerColor = userGame.color;
  const { game, result } = userGame;
  const { date } = game;
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString();
  }, [date]);
  const formattedTimeControl = useMemo(() => {
    const { timeControl } = game;
    return `${timeControl.timeSeconds / 60}+${timeControl?.incrementSeconds || 0}`;
  }, [game]);
  const moves = useMemo(() => {
    return game.data.moveHistory.length;
  }, [game]);
  const players = useMemo<Record<Chess.Color, Player>>(() => {
    const w = game.players.find((p) => p.color === "w");
    const b = game.players.find((p) => p.color === "b");
    return {
      w: {
        username: w?.user?.username || (game.guestPlayer?.color === "w" ? "Guest User" : null),
        rating: w?.rating,
        id: w?.user?.id,
      },
      b: {
        username: b?.user?.username || (game.guestPlayer?.color === "b" ? "Guest User" : null),
        rating: b?.rating,
        id: b?.user?.id,
      },
    };
  }, [game]);
  return (
    <tr className="hover:bg-elevation-3 text-sm text-light-100 border-b border-light-400">
      <td className="w-[1rem] hover:text-gold-100 cursor-pointer" onClick={onContextMenu}>
        <IoMdMore className="text-lg ml-2" />
      </td>
      <td>
        <div className="flex flex-col w-[180px] text-xs p-1 pl-0 ">
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
            {players.w.username || (
              <span className="opacity-50">
                <em>Account Deleted</em>
              </span>
            )}
            <span className="inline opacity-60 ml-1">{players.w.rating && `(${players.w.rating})`}</span>
          </p>
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-black mr-1" />
            {players.b.username || (
              <span className="opacity-50">
                <em>Account Deleted</em>
              </span>
            )}
            <span className="inline opacity-60 ml-1">{players.b.rating && `(${players.b.rating})`}</span>
          </p>
        </div>
      </td>
      <td>
        <ResultIcon result={result} />
      </td>
      <td>{formattedDate}</td>
      <td className="pl-1">
        {formattedTimeControl}
        <span className="inline"></span>
      </td>
      <td className="pl-1">{moves}</td>
    </tr>
  );
}

function ResultIcon({ result }: { result: "win" | "loss" | "draw" }) {
  switch (result) {
    case "win":
      return <MdArrowDropUp className="text-green-400 text-3xl" />;
    case "loss":
      return <MdArrowDropDown className="text-red-400 text-3xl" />;
    case "draw":
      return <ImMinus className="text-light-300 text-sm" />;
  }
}
