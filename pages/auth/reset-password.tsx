//Framework
import React, { useState, useContext, useCallback } from "react";
import Head from "next/head";
import { Button, Logo } from "@/components/base";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import _ from "lodash";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import YupPassword from "yup-password";

import { Input } from "@/components/base";
YupPassword(yup);

const schema = yup.object({
  password: yup.string().required("Password is required").min(8, "Password must contain 8 or more characters"),
  confirmPassword: yup.string().test("match", "Passwords do not match", function (confirmPassword) {
    return confirmPassword === this.parent.password;
  }),
});

type FormValues = {
  password: string;
  confirmPassword: string;
};
//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { NextPageContext } from "next";
import Link from "next/link";

interface PageProps {
  token: string;
}

const Page: NextPageWithLayout<PageProps> = ({ token }) => {
  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: yupResolver(schema),
  });
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const password = watch("password");
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const res = await axios.post("/api/auth/reset-password", { token, password: data.password });
      if (res.status === 200) {
        setSuccess(true);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    }
  };
  return (
    <>
      <Head>
        <title>NextChess | Reset Password</title>
        <meta name="Log In" content="Reset Passworn" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <Logo size="lg" />
          <h1 className="text-3xl font-semibold text-gold-200 my-4 mt-16">Reset Password</h1>

          <>
            {success ? (
              <>
                <p>
                  Your password was succesfully changed.{" "}
                  <Link href="/login" className="underline hover:text-gold-100">
                    Click here to login
                  </Link>
                </p>
              </>
            ) : (
              <>
                {" "}
                {!token || error ? (
                  <>
                    <h4>
                      <span className="text-danger-300 text-lg my-4">{`Something went wrong! This link is invalid or may have expired.`}</span>
                    </h4>
                    <p className="text-light-200 my-4">
                      <Link href="/forgot-password" className="underline hover:text-gold-200">
                        Click here
                      </Link>
                      {` to request a new verification email, or `}
                      <Link href="/login" className="underline hover:text-gold-200">
                        return to login page
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <form className="w-full max-w-md" onSubmit={handleSubmit(onSubmit)}>
                      <Input
                        id="Password"
                        label="New Password"
                        status={errors.password ? "error" : null}
                        type="password"
                        placeholder="Password"
                        error={(errors.password?.message as string) || null}
                        {...register("password", { deps: ["confirmPassword"] })}
                      />
                      <Input
                        id="ConfirmPassword"
                        label="Confirm New Password"
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
                      <Button type="submit" className="mx-auto w-full my-4" label="Reset Password"></Button>
                    </form>
                  </>
                )}{" "}
              </>
            )}
          </>
        </div>
      </div>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const token = ctx.query.token;
  return { props: { token: token || null } };
};

export default Page;
