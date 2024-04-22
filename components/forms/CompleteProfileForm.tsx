//Framework
import React, { useState, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
//UI Components
import { Input, Button } from "@/components/base";
import { RadioGroup } from "@headlessui/react";
//Context
import { UserContext } from "@/context/user";

//Util
import axios from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import _ from "lodash";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import YupPassword from "yup-password";

import User from "@/lib/db/entities/User";
import CountrySelect from "@/components/base/CountrySelect";
import { RadioButton, CheckBox } from "@/components/base/";
import { Label } from "@/components/base/Typography";
//ValidationSchemas
YupPassword(yup);
const schema = yup.object({
  username: yup.string().min(3, "Username must be at least 3 characters").max(20),
});

type FormValues = {
  username: string;
  name?: string;
  bio?: string;
};

type Profile = {
  username: string;
  rating: number;
  name?: string;
  bio?: string;
  country?: string;
};
interface Props {
  profile: User;
}
export default function SignUpForm({ profile }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: profile.username || "",
      name: profile.name || "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: yupResolver(schema),
  });
  const router = useRouter();
  const { refresh, user } = useContext(UserContext);
  const [usernameValid, setUsernameValid] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [rating, setRating] = useState(800);
  const [antiCheat, setAntiCheat] = useState(false);
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (data.username && !usernameValid) {
      setError("username", { message: "Username is already in use" });
      return;
    } else {
      let profile: Profile = {
        username: data.username,
        rating,
      };
      if (country) profile.country = country;
      if (data.name?.length) profile.name = data.name;
      const res = await axios.post("/api/user/complete-profile", profile);
      if (res.data.updated && res.data.profile) {
        console.log(res.data);
        refresh({ ...user, type: "user" });
        router.replace("/play");
      }
    }
  };
  const handleDebounceFn = async (query: string) => {
    const res = await axios.get(`api/auth/checkusername?username=${query}`);
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
      <div className="flex flex-col max-w-[500px]  w-full items-center justify-center ">
        <h2 className=" text-xl lg:text-2xl text-white mb-6 py-2 border-b-4 border-gold-200 px-2">
          Complete Your Profile
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
            disabled={profile.username ? true : false}
            {...register("username", {
              disabled: profile.username ? true : false,
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
            id="Name"
            error={errors.name ? (errors?.name?.message as string) || null : null}
            label="Name"
            status={errors.name ? "error" : null}
            type="text"
            placeholder="Full Name"
            {...register("name")}
          />

          <span className="flex flex-row items-center mb-1">
            <label className="block text-white/[0.6] text-md font-semibold " htmlFor={"country"}>
              Country
            </label>
            <p className="text-sm text-white/[0.3] font-medium ml-1 mt-[1px]">(optional)</p>
          </span>
          <CountrySelect
            value={country}
            onChange={(val) => {
              setCountry(val);
            }}
          />

          <SkillSelect
            onChange={(skill) => {
              setRating(skill.rating);
            }}
          />
          <CheckBox
            className="items-start mb-2"
            labelClasses="text-left text-sm mt-[-3x]"
            customLabel={() => {
              return (
                <p className="text-sm text-light-200 text-left mt-[-2px] ml-2">
                  By Checking this box, I agree to the Next-Chess{" "}
                  <Link href="/terms-of-service" className="underline hover:text-gold-200">
                    Terms of Service
                  </Link>{" "}
                  and Anti-Cheating policy
                </p>
              );
            }}
            checked={antiCheat}
            onChange={setAntiCheat}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!usernameValid || !rating || !antiCheat}
            label="Continue"
            width="full"
          />
        </form>
      </div>
    </div>
  );
}

interface SkillLevel {
  name: string;
  description: string;
  rating: number;
  iconPath: string;
}
const skillOptions = [
  { name: "Beginner", description: "< 1000", rating: 800, iconPath: "/assets/pieces/standard/bp.png" },
  { name: "Intermediated", description: "1000-1600", rating: 1200, iconPath: "/assets/pieces/standard/bn.png" },
  { name: "Advanced", description: "1600+", rating: 1600, iconPath: "/assets/pieces/standard/bq.png" },
];

interface SkillProps {
  onChange: (option: SkillLevel) => void;
}
function SkillSelect({ onChange }: SkillProps) {
  const [selected, setSelected] = useState(skillOptions[0]);

  return (
    <div className="w-full py-8">
      <div className="mx-auto w-full">
        <Label>Estimated Skill Level</Label>
        <RadioGroup
          value={selected}
          onChange={(val: SkillLevel) => {
            onChange(val);
            setSelected(val);
          }}
        >
          <RadioButton value={skillOptions[0]} label={`Beginner (0 - 1000)`} />
          <RadioButton value={skillOptions[1]} label={`Intermediate (1000 - 1600)`} />
          <RadioButton value={skillOptions[2]} label={`Advanced (1600+)`} />
        </RadioGroup>
      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
