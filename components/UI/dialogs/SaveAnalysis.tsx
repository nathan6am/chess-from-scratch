import { Dialog, Transition, RadioGroup } from "@headlessui/react";

//Framework
import React, { useState, useContext, useCallback, Fragment, useMemo } from "react";
import { Input, RadioButton } from "@/components/UIKit";
import CollectionSelect from "./CollectionSelect";
import Collection from "@/lib/db/entities/Collection";
//Util
import axios from "axios";
import { FieldValues, useForm, SubmitHandler, set } from "react-hook-form";
import _ from "lodash";
import { Button } from "@/components/UIKit";
import { HiSave } from "react-icons/hi";
interface Props {
  isOpen: boolean;
  closeModal: () => void;
  save: (data: AnalysisData) => void;
  moveText: string;
}
import { AnalysisData } from "@/lib/types";
import useCollections from "@/hooks/useCollections";
import { tagDataToPGNString } from "@/util/parsers/pgnParser";
export default function SaveAnalysis({ isOpen, closeModal, save, moveText }: Props) {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={closeModal} unmount={false}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/[0.3]" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg  px-4 sm:px-8 transform overflow-show rounded-2xl bg-[#202020] py-10 text-left align-middle shadow-lg transition-all">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-center font-gold-200">
                    Save Analysis
                  </Dialog.Title>
                  <div className="max-w-sm mx-auto ">
                    <SaveAnalysisForm save={save} moveText={moveText} closeModal={closeModal} />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

interface FormProps {
  initialData?: AnalysisData;
  save: (data: AnalysisData) => void;
  moveText: string;
  closeModal: () => void;
}
type FormValues = {
  title: string;
  description?: string;
  tags: string[];
  collectionIds: string[];
};
function SaveAnalysisForm({ initialData, save, moveText, closeModal }: FormProps) {
  const { collections, isLoading, createNew } = useCollections();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => {
    return collections.filter((c) => selectedIds.includes(c.id));
  }, [selectedIds, collections]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onSubmit", reValidateMode: "onChange" });
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const title = data.title;
    const description = data.description;
    const tagData = {};
    const pgn = tagDataToPGNString(tagData) + "\r\n" + moveText + " *";
    const saveData = {
      title,
      description,
      tagData,
      visibility,
      collectionIds: selected.map((c) => c.id),
      pgn,
    };
    console.log(saveData);
    save(saveData);
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="title"
          error={errors.title ? (errors?.title?.message as string) || null : null}
          label="Name"
          status={errors.title ? "error" : null}
          type="text"
          placeholder="Name"
          {...register("title", { required: "Name is required" })}
        />
        {/* <label className="text-white/[0.6] text-md font-semibold ">Description</label>
        <textarea
          spellCheck={true}
          placeholder="Add a description..."
          className={`w-full rounded-md mt-1 mb-3 border border-white/[0.2] bg-[#161616] resize-none px-2 py-1 focus:outine-none`}
          id="description"
          rows={3}
          {...register("description")}
        /> */}
        <CollectionSelect
          selected={selectedIds}
          setSelected={setSelectedIds}
          createNew={createNew}
          collections={collections}
          isLoading={isLoading}
        />
        {/* <RadioGroup value={visibility} onChange={setVisibility}>
          <RadioGroup.Label className="text-white/[0.6] text-md font-semibold ">
            Visibility
          </RadioGroup.Label>
          <RadioButton value="private" label="Private" />
          <RadioButton value="unlisted" label="Unlisted" />
          <RadioButton value="public" label="Public" />
        </RadioGroup> */}
        <div className="flex items-center justify-between flex-row gap-x-4 mt-4">
          <Button variant="neutral" onClick={closeModal} type="button" label="Cancel"></Button>
          <Button
            variant="success"
            icon={HiSave}
            iconClassName="ml-1 text-lg"
            iconPosition="right"
            type="submit"
            label="Save"
          ></Button>
        </div>
      </form>
    </div>
  );
}
