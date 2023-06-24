import React from "react";
import { Button } from "../UIKit";
import { BiStats } from "react-icons/bi";
import { AiFillTool, AiFillEdit } from "react-icons/ai";
import { MdOutlineExplore, MdModelTraining } from "react-icons/md";
import { FaChessBoard } from "react-icons/fa";
import Link from "next/link";
export default function Tools() {
  return (
    <div className="flex flex-col w-full items-center p-4 px-6 bg-elevation-2 shadow-lg rounded-lg">
      <div className="w-full max-w-md">
        <h2 className="text-gold-200 font-bold text-xl text-center">
          <AiFillTool className="inline mb-0.5 mr-2 " />
          Study Tools
        </h2>
        <Link href="/study/analyze">
          <Button
            className="w-full mt-6"
            size="lg"
            icon={FaChessBoard}
            variant="neutral"
            label="New Analysis Board"
            iconPosition="left"
            iconClassName="mr-2 mt-0.5 text-xl"
          />
        </Link>
        <Button
          className="w-full mt-4"
          size="lg"
          icon={MdOutlineExplore}
          variant="neutral"
          label="Opening Explorer"
          iconPosition="left"
          iconClassName="mr-2 mt-0.5 text-xl"
        />
        <Link href="/study/board-editor">
          <Button
            className="w-full mt-4"
            size="lg"
            icon={AiFillEdit}
            variant="neutral"
            label="Board Editor"
            iconPosition="left"
            iconClassName="mr-2 mt-0.5 text-xl"
          />
        </Link>

        <Button
          disabled
          className="w-full mt-4"
          size="lg"
          icon={MdModelTraining}
          variant="neutral"
          label="Move Trainer (Coming Soon)"
          iconPosition="left"
          iconClassName="mr-2 mt-0.5 text-xl"
        />
        <Button
          disabled
          className="w-full mt-4"
          size="lg"
          icon={MdModelTraining}
          variant="neutral"
          label="Tablebase (Coming Soon)"
          iconPosition="left"
          iconClassName="mr-2 mt-0.5 text-xl"
        />
      </div>
    </div>
  );
}
