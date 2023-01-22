//Framework
import React, { useState, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

//UI Components
import ButtonSocial from "@/components/UI/ButtonSocial";
import Input from "@/components/UI/Input";
import Field from "../Field";
//Context
import { UserContext } from "@/context/user";

//Util
import axios from "axios";
import { Formik } from "formik";
import _ from "lodash";
import * as yup from "yup";
import YupPassword from "yup-password";
YupPassword(yup);

//ValidationSchemas
const userNameSchema = yup
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20);
const emailSchema = yup.string().email("Please enter a valid email address");
const passwordSchema = yup
  .string()
  .required("required")
  .min(
    8,
    "Password must contain 8 or more characters with at least one of each: uppercase, lowercase, number and special"
  )
  .minLowercase(1, "password must contain at least 1 lower case letter")
  .minUppercase(1, "password must contain at least 1 upper case letter")
  .minNumbers(1, "password must contain at least 1 number")
  .minSymbols(1, "password must contain at least 1 special character");

export default function SignUpForm() {
  const handleDebounceFn = (query: string) => {
    console.log(query);
  };
  const debounceFn = useCallback(_.debounce(handleDebounceFn, 800), []);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState();
  const [status, setStatus] = useState<"error" | null>(null);
  const { refresh } = useContext(UserContext);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };
  return (
    <div className="flex flex-col items-center justify-center px-6 lg:px-10 xl:px-10 col-span-5 lg:col-span-2 min-h-[90%] lg:border-l border-white/[0.5] w-full my-4 mx-auto">
      <div className="flex flex-col max-w-[400px] items-center justify-center ">
        <h2 className=" text-xl lg:text-2xl text-white mb-6 py-2 border-b-4 border-sepia/[0.7] px-2">
          Create an Account
        </h2>
        <Formik
          initialValues={{
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          onSubmit={(values) => {
            console.log(values);
          }}
        ></Formik>
        <form className="w-full" onSubmit={onSubmit}>
          <Field
            name="username"
            id="Username"
            error={null}
            label="Username"
            status={status}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              e.preventDefault();
              debounceFn(e.target.value);
            }}
          />
          <Input
            id="Password"
            label="Password"
            status={status}
            type="password"
            placeholder="Password"
            value={password}
            error={null}
            onChange={(e) => {
              e.preventDefault();
              setStatus(null);
              setPassword(e.target.value);
            }}
          />
          <Input
            id="ConfirmPassword"
            status={status}
            type="password"
            placeholder="Re-enter Password"
            value={confirmPassword}
            error={null}
            onChange={(e) => {
              e.preventDefault();
              setStatus(null);
              setPassword(e.target.value);
            }}
          />

          <div className="flex flex-row justify-between w-full items-center px-2 mb-2 text-sm">
            <div className="flex flex-row items-center">
              <div className="w-4 h-4 rounded-sm border border-white/[0.5] mr-1 my-auto"></div>
              <p>Remember Me</p>
            </div>
            <a className="mr-4">Forgot password?</a>
          </div>
          <button
            type="submit"
            disabled={username === "" || password === ""}
            className={`text-md ${
              username === "" || password === ""
                ? "bg-neutral-500"
                : "bg-[#b99873] hover:bg-[#a58058]"
            }  text-white py-2 px-6 rounded-md w-full my-4`}
          >
            Sign In
          </button>
        </form>

        <div className="w-[90%] mx-auto border-b border-white/[0.5] my-2" />
        <ButtonSocial variant="google" href="/auth/google" />

        <ButtonSocial variant="facebook" href="/auth/facebook" />

        <p className="my-2 text-white opacity-50">or</p>
        <ButtonSocial variant="guest" href="/auth/guest"></ButtonSocial>
        <p className="text-white/[0.25] text-center px-4 mb-4 text-xs">
          By continuing or signing in, you agree to our{" "}
          <a className="hover:text-white/[0.5] underline">
            Terms and Conditions
          </a>{" "}
          and{" "}
          <a className="hover:text-white/[0.5]  underline">Privacy Policy</a>
        </p>
        <span className="flex flex-row justify-between px-2">
          <h3 className="text-white/[0.25] mr-2">Don't have an account?</h3>
          <Link href="/signup">
            <p className="text-white/[0.8] font-semibold">SIGN UP</p>
          </Link>
        </span>
      </div>
    </div>
  );
}
