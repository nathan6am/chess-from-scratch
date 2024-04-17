//Framework
import React, { useState } from "react";

//UI Components
import { Input } from "@/components/base";

//Util
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import _ from "lodash";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import YupPassword from "yup-password";
YupPassword(yup);

//ValidationSchemas
const schema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup.string().required("Password is required").min(8, "Password must contain 8 or more characters"),
  confirmNewPassword: yup.string().test("match", "Passwords do not match", function (confirmNewPassword) {
    return confirmNewPassword === this.parent.newPassword;
  }),
});

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};
export default function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onTouched", reValidateMode: "onChange", resolver: yupResolver(schema) });
  const newPassword = watch("newPassword");
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    axios
      .post("api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      .then(() => {
        setSuccessMessage("Password succesfully updated.");
        reset();
      })
      .catch((e) => {
        setError("currentPassword", { message: "Current Password is incorrect" });
      });
  };
  return (
    <div className="max-w-[30rem]">
      <h2 className="text-xl mb-4">Change Password</h2>

      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="CurrentPassword"
          error={errors.currentPassword ? (errors?.currentPassword?.message as string) || null : null}
          label="Current Password"
          status={errors.currentPassword ? "error" : null}
          type="password"
          placeholder="Current Password"
          {...register("currentPassword")}
        />
        <Input
          id="NewPassword"
          label="New Password"
          status={errors.newPassword ? "error" : null}
          type="password"
          placeholder="New Password"
          error={(errors.newPassword?.message as string) || null}
          {...register("newPassword", { deps: ["confirmNewPassword"] })}
        />
        <Input
          id="ConfirmPassword"
          status={errors.confirmNewPassword ? "error" : null}
          type="password"
          placeholder="Re-enter New Password"
          error={(errors.confirmNewPassword?.message as string) || null}
          {...register("confirmNewPassword", {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              if (e.target.value === newPassword) {
                clearErrors("confirmNewPassword");
              }
            },
          })}
        />
        {successMessage && <p>{successMessage}</p>}
        <button
          type="submit"
          disabled={false}
          className={`text-md ${"bg-[#b99873] hover:bg-[#a58058]"}  text-white py-2 px-6 rounded-md w-fit my-2`}
        >
          Change Password
        </button>
      </form>
    </div>
  );
}
