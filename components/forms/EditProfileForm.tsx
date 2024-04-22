import React from "react";
import { useForm, Control, Controller, SubmitHandler } from "react-hook-form";
import CountrySelect from "../base/CountrySelect";
import { Input, TextArea, Button } from "../base";
import { Label, PanelHeader } from "../base/Typography";
import useAuth from "@/hooks/queries/useAuth";
import { count } from "console";
interface FormValues {
  username: string;
  country?: string;
  name: string;
  bio?: string;
}
export default function EditProfileForm({ currentProfile, email }: { currentProfile: FormValues; email?: string }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: currentProfile,
  });

  watch();
  const { updateProfile } = useAuth({
    onProfileUpdate: (data) => {
      reset({ name: data.name, country: data.profile.country, bio: data.profile.bio });
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    updateProfile({
      country: data.country,
      bio: data.bio,
    });
  };
  return (
    <form className="max-w-md mb-8" onSubmit={handleSubmit(onSubmit)}>
      <PanelHeader className="mb-2 text-lg">Edit Profile</PanelHeader>
      <Input
        id="Username"
        error={errors.username ? (errors?.username?.message as string) || null : null}
        label="Username"
        status={errors.username ? "error" : null}
        type="text"
        placeholder="Username"
        {...register("username")}
        disabled
      />
      <Input
        id="Name"
        error={errors.name ? (errors?.name?.message as string) || null : null}
        label="Name"
        status={errors.name ? "error" : null}
        type="text"
        placeholder="Full Name"
        {...register("name")}
      />
      <Label>Country</Label>
      <Controller
        control={control}
        name="country"
        render={({ field }) => {
          return <CountrySelect onChange={field.onChange} value={field.value || null} />;
        }}
      />
      <Label className="mt-4 mb-2">Bio</Label>
      <TextArea {...register("bio")} id="bio" placeholder="Tell us about yourself" />
      {isDirty && (
        <div className="flex flex-row items-center">
          <Button type="submit" className="mt-4" label="Save" variant="success">
            Save Changes
          </Button>
          <Button type="button" className="mt-4 ml-2" label="Cancel" variant="neutral" onClick={() => reset()} />
        </div>
      )}
    </form>
  );
}
