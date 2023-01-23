//Framework
import React, { useState, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

//UI Components
import ButtonSocial from "@/components/UI/ButtonSocial";
import Input from "@/components/UI/Input";

//Context
import { UserContext } from "@/context/user";

//Util
import axios from "axios";
import { FieldValues, useForm, SubmitHandler, set } from "react-hook-form";
import _ from "lodash";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import YupPassword from "yup-password";
YupPassword(yup);

//ValidationSchemas
const schema = yup.object({
  username: yup.string().required("Username is required").min(3, "Username must be at least 3 characters").max(20),
  email: yup.string().required("Email is required").email("Please enter a valid email address"),
  password: yup.string().required("Password is required").min(8, "Password must contain 8 or more characters"),
  confirmPassword: yup.string().test("match", "Passwords do not match", function (confirmPassword) {
    return confirmPassword === this.parent.password;
  }),
});

type FormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onTouched", reValidateMode: "onChange", resolver: yupResolver(schema) });
  const router = useRouter();
  const { refresh } = useContext(UserContext);
  const password = watch("password");
  const [usernameValid, setUsernameValid] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!usernameValid) {
      setError("username", { message: "Username is already in use" });
      return;
    } else {
      const res = await axios.post("/auth/signup", {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (res.data.fieldErrors) {
        const errors = res.data.fieldErrors as Array<{ field: string; message: string }>;
        errors.forEach((error) => {
          if (error.field === "email") setError(error.field, { message: error.message });
        });
      } else if (res.data.user) {
        refresh(res.data.user);
        router.push("/play");
      }
    }
  };
  const handleDebounceFn = async (query: string) => {
    const res = await axios.get(`/auth/checkusername?username=${query}`);
    if (res.data) {
      setVerifying(false);
      if (res.data.valid === false) {
        setUsernameValid(false);
      } else if (res.data.valid) {
        setUsernameValid(true);
      }
    }
  };
  const debounceFn = useCallback(_.debounce(handleDebounceFn, 800), []);

  return (
    <div className="flex flex-col items-center justify-center px-6 lg:px-10 xl:px-10 col-span-5 lg:col-span-2 min-h-[90%]  w-full my-4 mx-auto">
      <div className="flex flex-col max-w-[400px] items-center justify-center ">
        <h2 className=" text-xl lg:text-2xl text-white mb-6 py-2 border-b-4 border-sepia/[0.7] px-2">
          Create an Account
        </h2>

        <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="Username"
            error={usernameValid ? (errors.username?.message as string) || null : "Username already in use"}
            label="Username"
            status={errors.username || !usernameValid ? "error" : null}
            type="text"
            placeholder="Username"
            verifying={verifying}
            {...register("username", {
              required: { value: true, message: "Please enter a username" },
              minLength: { value: 3, message: "username must be at least 3 characters" },
              maxLength: { value: 21, message: "Max length exceeded" },
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.trim();
                if (e.target.value.length > 20) e.target.value = e.target.value.slice(0, 20);
                if (e.target.value.length > 3) {
                  setVerifying(true);
                  debounceFn(e.target.value);
                } else {
                  setUsernameValid(true);
                  setVerifying(false);
                }
              },
            })}
          />
          <Input
            id="Email"
            error={errors.email ? (errors?.email?.message as string) || null : null}
            label="Email"
            status={errors.email ? "error" : null}
            type="text"
            placeholder="Email"
            {...register("email")}
          />
          <Input
            id="Password"
            label="Password"
            status={errors.password ? "error" : null}
            type="password"
            placeholder="Password"
            error={(errors.password?.message as string) || null}
            {...register("password", { deps: ["confirmPassword"] })}
          />
          <Input
            id="ConfirmPassword"
            status={errors.confirmPassword ? "error" : null}
            type="password"
            placeholder="Re-enter Password"
            error={(errors.confirmPassword?.message as string) || null}
            {...register("confirmPassword", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value === password) {
                  clearErrors("confirmPassword");
                }
              },
            })}
          />

          <button
            type="submit"
            disabled={false}
            className={`text-md ${"bg-[#b99873] hover:bg-[#a58058]"}  text-white py-2 px-6 rounded-md w-full my-2`}
          >
            Continue
          </button>
        </form>

        <p className="my-2 text-white opacity-50">or</p>
        <ButtonSocial variant="google" href="/auth/google">
          Sign Up with Google
        </ButtonSocial>

        <ButtonSocial variant="facebook" href="/auth/facebook">
          Sign Up with Facebook
        </ButtonSocial>

        <p className="text-white/[0.25] text-center px-4 mb-4 mt-2 text-xs">
          By signing up, you agree to our <a className="hover:text-white/[0.5] underline">Terms and Conditions</a> and{" "}
          <a className="hover:text-white/[0.5]  underline">Privacy Policy</a>
        </p>
        <span className="flex flex-row justify-between px-2">
          <h3 className="text-white/[0.25] mr-2">Already have an account?</h3>
          <Link href="/login">
            <p className="text-white/[0.8] font-semibold">SIGN IN</p>
          </Link>
        </span>
      </div>
    </div>
  );
}
