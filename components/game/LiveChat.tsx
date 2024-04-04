import React, { useState, useRef, useContext, useEffect } from "react";
import { GameContext } from "../GameOnline";
import { MdChatBubble } from "react-icons/md";
import { IoMdSend } from "react-icons/io";
import { ScrollContainer } from "../layout/GameLayout";
import { UserContext } from "@/context/user";
import { ChatMessage } from "@/server/types/lobby";
import classNames from "classnames";
export default function LiveChat() {
  const { user } = useContext(UserContext);
  const { onlineGame } = useContext(GameContext);
  const { chat, sendMessage } = onlineGame;
  const [message, setMessage] = useState<string>("");
  const [showChat, setShowChat] = useState<boolean>(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onSubmit = () => {
    if (message.length) {
      sendMessage(message);
      setMessage("");
    }
  };
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);
  return (
    <div className="w-full  flex flex-col bg-elevation-1 ">
      <div className=" w-full py-1.5 px-4 text-sm bg-elevation-3 text-gold-200 flex flex-row justify-between">
        <div>
          <MdChatBubble className="inline mr-1" />
          Live Chat
        </div>
        <button
          onClick={() => {
            setShowChat(!showChat);
          }}
          className="text-xs"
        >
          {showChat ? "Hide Chat" : "Show Chat"}
        </button>
      </div>
      {showChat && (
        <>
          <div className="h-[10em] relative ">
            <ScrollContainer>
              <div className="w-full flex flex-col px-4 py-4">
                {chat.map((message, idx, messages) => {
                  const previousMessage = messages[idx - 1];
                  const labelSender = !previousMessage || previousMessage.author.id !== message.author.id;
                  const isSender = message.author.id === user?.id;
                  return (
                    <RenderMessage
                      message={message}
                      key={message.timestampISO}
                      labelSender={labelSender}
                      isSender={isSender}
                    />
                  );
                })}
                <div ref={scrollRef}></div>
              </div>
            </ScrollContainer>
          </div>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="w-full px-2 py-3 flex flex-row items-center ">
              <textarea
                ref={inputRef}
                spellCheck={false}
                placeholder="Type to chat"
                rows={1}
                className={`w-full bg-transparent border border-light-400 rounded-md resize-none px-2 py-1 text-light-200 placeholder:text-light-400 focus:outline-none focus:border-gold-200 focus:bg-elevation-1`}
                id="messageInput"
                value={message}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSubmit();
                  }
                }}
                onChange={(e) => {
                  const value = e.target.value.replace(/[\r\n\v]+/g, "");
                  setMessage(value);
                }}
              />
              <button className=" text-xl text-light-200 hover:text-gold-200 mx-3">
                <IoMdSend />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function RenderMessage({
  message,
  isSender,
  labelSender,
}: {
  message: ChatMessage;
  isSender: boolean;
  labelSender: boolean;
}) {
  return (
    <div
      className={classNames("flex flex-row w-full", {
        "justify-end": isSender,
        "justify-start": !isSender,
      })}
    >
      <div className="flex flex-col">
        {labelSender && (
          <p
            className={classNames("text-light-300 text-xs", {
              "text-right": isSender,
            })}
          >
            {message.author.username}
          </p>
        )}
        <div
          className={classNames("px-4 py-1 w-fit text-light-100 my-2 shadow", {
            "bg-gold-300/[0.8] mr-8 justify-self-start rounded-r-md rounded-bl-md": !isSender,
            "bg-elevation-4 ml-8 justify-self-end rounded-l-md rounded-br-md": isSender,
          })}
        >
          <p>{message.message}</p>
        </div>
      </div>
    </div>
  );
}
