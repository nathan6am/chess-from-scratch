import { AnalysisContext } from "./AnalysisBoard";
import { useContext, useEffect, useState } from "react";
import { Button, Input, Label, Select } from "@/components/UIKit";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { WhiteIcon, BlackIcon, DrawIcon } from "../menu/NewGame";
import type { PGNTagData } from "@/lib/types";
export default function EditDetails() {
  const { analysis, saveManager } = useContext(AnalysisContext);

  return <TagForm tags={analysis.tagData} setTags={analysis.setTagData} />;
}

interface TagFormProps {
  tags: PGNTagData;
  setTags: React.Dispatch<React.SetStateAction<PGNTagData>>;
}

type FormValues = {
  white?: string;
  black?: string;
  eloWhite?: string;
  eloBlack?: string;
  event?: string;
  site?: string;
  round?: string;
  date?: string;
  result?: "1-0" | "0-1" | "1/2-1/2" | "*";
  termination?: string;
};
function TagForm({ tags, setTags }: TagFormProps) {
  const defaultValues = {
    white: tags.white,
    black: tags.black,
    eloWhite: tags.eloWhite,
    eloBlack: tags.eloBlack,
    event: tags.event,
    site: tags.site,
    round: tags.round,
    date: tags.date ? tags.date.replaceAll(".", "-") : tags.date,
    result: tags.result,
  };
  const { register, handleSubmit, watch, setError, clearErrors, reset, formState, control } = useForm<FormValues>({
    defaultValues: defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors, isDirty } = formState;
  const [loading, setLoading] = useState(false);

  //Watch all fields to trigger isDirty ?
  const fields = watch();

  const onSubmit: SubmitHandler<FormValues> = (data: FormValues) => {
    setLoading(true);
    setTags((cur) => ({ ...cur, ...data }));
  };
  const { saveManager } = useContext(AnalysisContext);
  useEffect(() => {
    if (loading) {
      if (!saveManager.id) {
        setLoading(false);
        reset(defaultValues);
      } else if (saveManager.syncStatus === "synced") {
        setLoading(false);
        reset(defaultValues);
      }
    }
  }, [loading, saveManager.syncStatus, saveManager.id]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="py-4 px-6 bg-elevation-2">
        <div className="flex flex-row items-end">
          <Input
            containerClassName="mb-2"
            label="White"
            error={errors.white?.message || null}
            id="white"
            placeholder="White Player"
            showErrorMessages={false}
            {...register("white")}
          />
          <Input
            label="Elo"
            containerClassName="w-40 ml-4 mb-2"
            error={errors.eloWhite?.message || null}
            id="whiteElo"
            showErrorMessages={false}
            {...register("eloWhite")}
          />
        </div>

        <div className="flex flex-row items-end">
          <Input
            containerClassName="mb-2"
            label="Black"
            error={errors.white?.message || null}
            id="black"
            placeholder="Black Player"
            showErrorMessages={false}
            {...register("black")}
          />
          <Input
            label="Rating"
            containerClassName="w-40 ml-4 mb-2"
            error={errors.eloWhite?.message || null}
            id="eloBlack"
            showErrorMessages={false}
            {...register("eloBlack")}
          />
        </div>
        <div className="flex flex-row items-end">
          <Input
            containerClassName="mb-2"
            label="Event"
            error={errors.event?.message || null}
            id="event"
            placeholder="Event"
            showErrorMessages={false}
            {...register("event")}
          />
          <Input
            containerClassName="w-20 ml-4 mb-2"
            label="Round"
            error={errors.round?.message || null}
            id="round"
            showErrorMessages={false}
            {...register("round")}
          />
        </div>
        <div className="flex flex-row items-end">
          <Input
            containerClassName="mb-2"
            label="Site"
            error={errors.site?.message || null}
            id="site"
            placeholder="Site"
            showErrorMessages={false}
            {...register("site")}
          />
          <Input
            containerClassName="ml-4 mb-2"
            label="Date"
            error={errors.round?.message || null}
            id="date"
            type="date"
            showErrorMessages={false}
            {...register("date")}
          />
        </div>
        <div className="flex flex-row items-end">
          <div className="mr-4">
            <Label className="mb-0.5">Result</Label>
            <Controller
              control={control}
              name="result"
              render={({ field }) => {
                const options = [
                  { value: "1-0", label: "1-0" },
                  { value: "0-1", label: "0-1" },
                  { value: "1/2-1/2", label: "½-½" },
                  { value: "*", label: "*" },
                ];
                return (
                  <Select
                    className="w-32"
                    options={options}
                    value={field.value || "*"}
                    onChange={(value) => field.onChange(value)}
                  />
                );
              }}
            />
          </div>
          <Input
            containerClassName="mt-2"
            label="Termination"
            error={errors.termination?.message || null}
            id="termination"
            placeholder="e.g. White resigns"
            showErrorMessages={false}
            {...register("termination")}
          />
        </div>
        {isDirty && (
          <div className="flex flex-row justify-end mt-4">
            <Button
              className="mr-2 mt-4"
              variant="neutral"
              label="Cancel"
              onClick={() => {
                reset();
                clearErrors();
              }}
            />
            <Button
              isLoading={loading}
              loadingLabel="Saving..."
              className="mt-4"
              type="submit"
              variant="success"
              label="Save Changes"
            />
          </div>
        )}
      </form>
    </>
  );
}
