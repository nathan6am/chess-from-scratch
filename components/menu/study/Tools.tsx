import React from "react";
import { Button } from "@/components/base";
import { AiFillTool, AiFillEdit } from "react-icons/ai";
import { MdOutlineExplore, MdModelTraining } from "react-icons/md";
import { FaChessBoard } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { PanelHeader } from "@/components/base/Typography";
import Link from "next/link";
export default function Tools() {
  return (
    <div className="flex flex-col w-full items-center p-4">
      <div className="w-full max-w-md">
        <PanelHeader>
          <AiFillTool className="inline mb-0.5 mr-2 " />
          Study Tools
        </PanelHeader>
        <Link href="/study/analyze">
          <Button
            className="w-full mt-6"
            size="lg"
            icon={FaChessBoard}
            variant="neutral"
            label="Analysis Board/PGN Editor"
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

        <Button
          disabled
          className="w-full mt-4"
          size="lg"
          icon={MdModelTraining}
          variant="neutral"
          label="Repertoire Builder (Coming Soon)"
          iconPosition="left"
          iconClassName="mr-2 mt-0.5 text-xl"
        />
        <Button
          disabled
          className="w-full mt-4"
          size="lg"
          icon={SiGoogleclassroom}
          variant="neutral"
          label="Classroom (Coming Soon)"
          iconPosition="left"
          iconClassName="mr-2 mt-0.5 text-xl"
        />
      </div>
    </div>
  );
}