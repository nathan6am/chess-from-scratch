import { UserContext } from "@/context/user";
import Head from "next/head";
import { useEffect, useState, useContext } from "react";
import { SocketContext } from "@/context/socket";
import NonSSRWrapper from "@/components/NonSSRWrapper";
import { useRouter } from "next/router";
import GameLocal from "@/components/GameLocal";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const socket = useContext(SocketContext);
  const user = useContext(UserContext);
  useEffect(() => {
    socket.on("connect", () => {
      setConnected(socket.connected);
    });
    setConnected(socket.connected);
    return () => {
      socket.off("connect");
    };
  }, []);
  const router = useRouter();
  return (
    <div className="h-screen w-screen justify-center items-center flex bg-elevation-0">
      <Head>
        <title>Next-Chess</title>
        <meta name="description" content="Play chess with next-chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex container justify-center items-center w-full h-full">
        <div className="md:h-full w-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <GameLocal />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
}
