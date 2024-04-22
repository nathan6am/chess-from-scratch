//Framework
import React, { useState, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

//UI Components
import { Input, Button, ButtonSocial } from "@/components/base";

//Context
import { UserContext } from "@/context/user";

//Util
import axios from "axios";

export default function SignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [status, setStatus] = useState<"error" | null>(null);
  const { refresh } = useContext(UserContext);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    if (!username || !password) return;
    try {
      const res = await axios.post("api/auth/login", {
        username: username,
        password: password,
      });
      refresh();
      if (res.data) {
        router.push("/play");
      }
    } catch (e) {
      setStatus("error");
      setLoginError("Invalid username or password");
    }
  };
  return (
    <div className="flex flex-col items-center justify-center px-6 lg:px-10 xl:px-10 col-span-5 lg:col-span-2 min-h-[90%] lg:border-l border-white/[0.5] w-full my-4 mx-auto">
      <div className="flex flex-col max-w-[400px] items-center justify-center ">
        <h2 className=" text-xl lg:text-2xl text-white mb-6 py-2 border-b-4 border-gold-200 px-2">
          Sign In to Continue
        </h2>
        <form className="w-full" onSubmit={onSubmit}>
          <Input
            id="Username"
            error={null}
            label="Username"
            status={status}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              e.preventDefault();
              setStatus(null);
              setUsername(e.target.value);
            }}
          />
          <Input
            id="Password"
            label="Password"
            status={status}
            type="password"
            placeholder="Password"
            value={password}
            error={loginError}
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
            <Link href="/auth/forgot-password" className="mr-4">
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            disabled={username === "" || password === ""}
            className="my-4"
            label="Sign In"
            loadingLabel="Signing In..."
          >
            Sign In
          </Button>
        </form>

        <div className="w-[90%] mx-auto border-b border-white/[0.5] my-2" />
        <ButtonSocial variant="google" href="api/auth/google" className="mt-4" />

        <ButtonSocial variant="facebook" href="api/auth/facebook" />

        <p className="my-2 text-white opacity-50">or</p>
        <Link href={"/api/auth/guest"} className="w-full">
          <Button variant="neutral" className="my-2" width="full" label="Continue as Guest" loadingLabel="Loading..." />
        </Link>
        <p className="text-white/[0.25] text-center px-4 mb-4 text-xs">
          By continuing or signing in, you agree to our{" "}
          <Link href="/terms-and-conditions" className="hover:text-white/[0.5] underline">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-white/[0.5]  underline">
            Privacy Policy
          </Link>
        </p>
        <span className="flex flex-row justify-between px-2">
          <h3 className="text-white/[0.25] mr-2">{`Don't have an account?`}</h3>
          <Link href="/signup">
            <p className="text-white/[0.8] font-semibold">SIGN UP</p>
          </Link>
        </span>
      </div>
    </div>
  );
}
