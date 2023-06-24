import { AnalysisContext } from "./AnalysisBoard";
import { useContext } from "react";
import { Button, Input, Label, Select } from "@/components/UIKit";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { WhiteIcon, BlackIcon, DrawIcon } from "../menu/NewGame";
import type { PGNTagData } from "@/lib/types";
export default function EditDetails() {
  const { analysis } = useContext(AnalysisContext);
  return <TagForm tags={analysis.tagData} setTags={analysis.setTagData} />;
}

interface TagFormProps {
  tags: PGNTagData;
  setTags: React.Dispatch<React.SetStateAction<PGNTagData>>;
}
function TagForm({ tags, setTags }: TagFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
    control,
  } = useForm<PGNTagData>({
    defaultValues: { ...tags, date: tags.date ? tags.date.replaceAll(".", "-") : tags.date },
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<PGNTagData> = (data: PGNTagData) => {
    setTags(data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="py-4 px-6 bg-elevation-2">
      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="White"
          {...register("white")}
          error={errors.white?.message || null}
          id="white"
          placeholder="White Player"
          showErrorMessages={false}
        />
        <Input
          label="Elo"
          containerClassName="w-40 ml-4 mb-2"
          {...register("eloWhite")}
          error={errors.eloWhite?.message || null}
          id="whiteElo"
          placeholder="Rating"
          showErrorMessages={false}
        />
      </div>

      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="Black"
          {...register("black")}
          error={errors.white?.message || null}
          id="black"
          placeholder="Black Player"
          showErrorMessages={false}
        />
        <Input
          label="Elo"
          containerClassName="w-40 ml-4 mb-2"
          {...register("eloBlack")}
          error={errors.eloWhite?.message || null}
          id="eloBlack"
          placeholder="Rating"
          showErrorMessages={false}
        />
      </div>
      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="Event"
          {...register("event")}
          error={errors.event?.message || null}
          id="event"
          placeholder="Event"
          showErrorMessages={false}
        />
        <Input
          containerClassName="w-20 ml-4 mb-2"
          label="Round"
          {...register("round")}
          error={errors.round?.message || null}
          id="round"
          placeholder="Round"
          showErrorMessages={false}
        />
      </div>
      <div className="flex flex-row items-end">
        <Input
          containerClassName="mb-2"
          label="Site"
          {...register("site")}
          error={errors.site?.message || null}
          id="site"
          placeholder="Site"
          showErrorMessages={false}
        />
        <Input
          containerClassName="ml-4 mb-2"
          label="Date"
          {...register("date")}
          error={errors.round?.message || null}
          id="date"
          type="date"
          showErrorMessages={false}
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
          {...register("termination")}
          error={errors.termination?.message || null}
          id="termination"
          placeholder="e.g. White resigns"
          showErrorMessages={false}
        />
      </div>
      <Button className="mt-4" type="submit" variant="success" label="Save Changes" />
    </form>
  );
}
