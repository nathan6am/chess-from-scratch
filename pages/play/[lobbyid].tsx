import React from "react";
import { NextPage, NextPageContext } from "next";
import useChessOnline from "@/hooks/useChessOnline";
interface Props {
  lobbyid: string;
}

const Lobby: NextPage<Props> = ({ lobbyid }) => {
  const { connected, test, acknowledge } = useChessOnline(lobbyid);
  return (
    <div className="flex flex-col p-4">
      <div>{connected ? "connected" : "false"}</div>
      <button className="p-4 m-4 bg-red" onClick={test}>
        Test Timeout
      </button>
      <button className="p-4 m-4 bg-red" onClick={acknowledge}>
        TAcknowledge
      </button>
    </div>
  );
};

interface Context extends NextPageContext {
  query: {
    lobbyid: string;
  };
}
Lobby.getInitialProps = async (ctx: Context) => {
  const { lobbyid } = ctx.query;
  return { lobbyid: lobbyid as string };
};

export default Lobby;
