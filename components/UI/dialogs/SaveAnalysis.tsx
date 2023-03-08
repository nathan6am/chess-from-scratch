import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import RadioButton from "../RadioButton";
//Framework
import React, { useState, useContext, useCallback, Fragment, useMemo } from "react";
import Input from "@/components/UI/Input";
import CollectionSelect from "./CollectionSelect";
//Util
import axios from "axios";
import { FieldValues, useForm, SubmitHandler, set } from "react-hook-form";
import _ from "lodash";
import * as yup from "yup";

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  save: (data: AnalysisData) => void;
}
import { AnalysisData } from "@/hooks/useAnalysisBoard";
import useCollections from "@/hooks/useCollections";
export default function SaveAnalysis({ isOpen, closeModal, save }: Props) {
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
                  <Dialog.Title as="h3" className="text-2xl font-semibold text-center">
                    Save Analysis
                  </Dialog.Title>
                  <div className="max-w-sm mx-auto mb-20">
                    <SaveAnalysisForm save={save} />
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
}
type FormValues = {
  title: string;
  description?: string;
  tags: string[];
  collectionIds: string[];
};
function SaveAnalysisForm({ initialData, save }: FormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onTouched", reValidateMode: "onChange" });
  const [collTitle, setCollTitle] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const collections = useCollections();
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const title = data.title;
    const description = data.description;
    const tags: string[] = [];
    save({
      title,
      description,
      tags,
      visibility,
      collectionIds: [],
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="title"
          error={errors.title ? (errors?.title?.message as string) || null : null}
          label="Title"
          status={errors.title ? "error" : null}
          type="text"
          placeholder="Title"
          {...register("title")}
        />
        <textarea
          spellCheck={true}
          placeholder="Add a description..."
          className={`w-full rounded-md border border-white/[0.2] bg-[#161616] resize-none px-2 py-1`}
          id="description"
          rows={3}
          {...register("description")}
        />
        <CollectionSelect />
        <RadioGroup value={visibility} onChange={setVisibility}>
          <RadioGroup.Label>Visibility</RadioGroup.Label>
          <RadioButton value="private" label="Private" />
          <RadioButton value="unlisted" label="Unlisted" />
          <RadioButton value="public" label="Public" />
        </RadioGroup>
        <button>Save</button>
        <button
          onClick={() => {
            collections.createNew(collTitle);
          }}
        >
          Create Collections
        </button>
      </form>
    </div>
  );
}
