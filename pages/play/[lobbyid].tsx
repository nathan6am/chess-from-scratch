import React from "react";
import { NextPage, NextPageContext } from "next";
import useChessOnline from "@/hooks/useChessOnline";
interface Props {
  lobbyid: string;
}

const Lobby: NextPage<Props> = ({ lobbyid }) => {
  const chess = useChessOnline(lobbyid);
  return <div>{chess ? "connected" : "false"}</div>;
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
