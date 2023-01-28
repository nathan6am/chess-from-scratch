import React, { useContext, useState, useEffect } from "react";

export default function Lobby() {
  const [connected, setConnected] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [lobby, updateLobby] = useState(null);
  return <div>GameOnline</div>;
}
