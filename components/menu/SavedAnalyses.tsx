import React from "react";
import useCollections from "@/hooks/useCollections";
import type Collection from "@/lib/db/entities/Collection";
import type Analysis from "@/lib/db/entities/Analysis";
import { Disclosure, Transition } from "@headlessui/react";
import { MdExpandMore } from "react-icons/md";
import { FaFolder, FaChessBoard } from "react-icons/fa";
import { AiFillFile } from "react-icons/ai";
import { AiOutlineExport } from "react-icons/ai";
import { BsFillCollectionFill, BsFillShareFill } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { useRouter } from "next/router";
import classNames from "classnames";
import FileBrowser from "./FileBrowser";
export default function SavedAnalyses() {
  const { collections } = useCollections();
  return (
    <div className="flex flex-col w-full h-full items-center  bg-elevation-2 shadow-lg rounded-lg">
      <div className="p-3 w-full px-6 flex flex-row justify-between shadow-lg">
        <h2 className="text-gold-200 font-bold text-xl  text-left ">Saved Analyses</h2>
      </div>
      {/* <h2>Collections</h2>
      {collections.map((collection) => {
        return <RenderCollection key={collection.id} collection={collection} />;
      })} */}
      <FileBrowser />
    </div>
  );
}

function RenderCollection({ collection }: { collection: Collection }) {
  return (
    <StyledDiclosure label={collection.title} size={collection.analyses.length}>
      {collection.analyses.map((analysis) => {
        return <RenderAnalysis key={analysis.id} analysis={analysis} />;
      })}
    </StyledDiclosure>
  );
}

function RenderAnalysis({ analysis }: { analysis: Analysis }) {
  const router = useRouter();
  const onClick = () => {
    router.push(`/study/analyze?id=${analysis.id}`);
  };
  return (
    <div
      onClick={onClick}
      className="flex flex-row w-full items-center justify-between py-1 pb-1.5 px-2 hover:bg-elevation-3 rounded-sm"
    >
      <div className="flex flex-row items-center">
        <AiFillFile className="mr-2 inline text-light-300" />
        <span>{analysis.title}</span>
      </div>
      <div className="flex flex-row items-center">
        <button className="text-light-300 hover:text-gold-100">
          <BsFillShareFill className="mr-2 inline " />
        </button>
        <button className="text-light-300 hover:text-gold-100">
          <AiOutlineExport className="mr-1 inline text-xl " />
        </button>
        <button className="text-light-300 hover:text-danger-300">
          <MdDelete className="inline text-xl  mb-[1px]" />
        </button>
      </div>
    </div>
  );
}

interface StyledDisclosureProps {
  children: JSX.Element | string | Array<JSX.Element | string>;
  label: string;
  size?: number;
}
function StyledDiclosure({ children, label, size = 0 }: StyledDisclosureProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={classNames(
              "flex justify-between w-full px-4 py-2 font-medium text-left text-light-200 hover:text-light-100 hover:bg-elevation-3",
              "focus:outline-none focus-visible:ring focus-visible:ring-white focus-visible:ring-opacity-75 group",
              {
                "text-light-100": open,
                "bg-elevation-3": open,
              }
            )}
          >
            <div
              className={classNames(" text-light-200 flex flex-row items-center group-hover:text-light-100", {
                "text-light-100": open,
              })}
            >
              <BsFillCollectionFill className="mr-2 inline text-gold-200" />
              {label}
              <span className="text-light-400 ml-1 text-sm">{`(${size})`}</span>
            </div>
            <MdExpandMore
              className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl ${
                open ? "" : "rotate-[-90deg]"
              }`}
            />
          </Disclosure.Button>

          <Disclosure.Panel className="px-4 pl-8 pt-2 pb-2 border-light-400/[0.2] border-b divide-y divide-light-400/[0.2]  w-full ">
            {children}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
