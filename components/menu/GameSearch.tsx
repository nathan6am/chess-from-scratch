import React, { useState, useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { GameSearchOptions } from "@/lib/db/entities/User_Game";
import { MultiSelect, Select, Input, Button } from "@/components/base";
import { Label } from "@/components/base/Typography";
import { useInView } from "react-intersection-observer";

import useGameSearch from "@/hooks/queries/useGameSearch";
import GameList from "./GameList";
export default function GameSearch() {
  const [filters, setFilters] = useState<GameSearchOptions>({});
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
    control,
  } = useForm<GameSearchOptions>();
  const values = watch();
  const { games, isLoading, error, loadMore, hasMore, isLoadingMore } = useGameSearch(filters);
  const onSubmit: SubmitHandler<GameSearchOptions> = (data: GameSearchOptions) => setFilters(data);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    root: containerRef.current,
  });

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, loadMore, hasMore]);
  return (
    <div className="flex flex-col w-full h-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className="text-lg font-semibold text-gold-200 bg-elevation-2 w-full pt-3 px-4">Filter Games</h3>
        <div className="flex flex-wrap flex-row items-end bg-elevation-2 space-x-2 p-2 pl-3 pb-4 space-y-2">
          <Controller
            control={control}
            name="result"
            render={({ field }) => {
              const options = [
                { value: "win", label: "Win" },
                { value: "loss", label: "Loss" },
                { value: "draw", label: "Draw" },
              ];
              return (
                <div className="ml-2 mt-2">
                  <Label>Result</Label>
                  <MultiSelect
                    showAllowAny
                    className="w-40"
                    options={options}
                    value={field.value || []}
                    onChange={(value) => field.onChange(value)}
                  />
                </div>
              );
            }}
          />
          <Controller
            control={control}
            name="ratingCategory"
            render={({ field }) => {
              const options = [
                { value: "bullet", label: "Bullet" },
                { value: "blitz", label: "Blitz" },
                { value: "rapid", label: "Rapid" },
                { value: "classical", label: "Classical" },
                { value: "correspondence", label: "Correspondence" },
              ];
              return (
                <div>
                  <Label>Time Control</Label>
                  <MultiSelect
                    showAllowAny
                    className="w-40"
                    optionsClassName="w-[18rem]"
                    options={options}
                    value={field.value || []}
                    onChange={(value) => field.onChange(value)}
                  />
                </div>
              );
            }}
          />
          <Controller
            control={control}
            name="sortBy"
            render={({ field }) => {
              const options = [
                { value: "date", label: "Date" },
                { value: "rating", label: "Rating" },
                { value: "opponentRating", label: "Opponent Rating" },
              ];
              return (
                <div>
                  <Label>Sort By</Label>
                  <Select
                    className="w-40"
                    options={options}
                    value={field.value || "date"}
                    onChange={(value) => field.onChange(value)}
                  />
                </div>
              );
            }}
          />
          <Controller
            control={control}
            name="asColor"
            render={({ field }) => {
              const options = [
                { value: "w", label: "White" },
                { value: "b", label: "Black" },
                { value: "any", label: "Any" },
              ];
              return (
                <div>
                  <Label>As Color</Label>
                  <Select
                    className="w-40"
                    options={options}
                    value={field.value || "any"}
                    onChange={(value) => field.onChange(value)}
                  />
                </div>
              );
            }}
          />
          <Input containerClassName="w-48" type="date" {...register("after")} label="From" showErrorMessages={false} />
          <Input
            containerClassName="w-48"
            className="py-2"
            type="date"
            {...register("before")}
            label="Until"
            showErrorMessages={false}
          />
          <Button type="submit" variant="neutral" label="Update Search" width="fit" className="mt-2"></Button>
        </div>
      </form>
      <GameList
        usergames={games}
        hasMore={hasMore}
        loadMore={loadMore}
        isLoadingMore={isLoadingMore}
        isLoading={isLoading}
      />
    </div>
  );
}
