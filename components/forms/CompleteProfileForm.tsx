//Framework
import React, { useState, useContext, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
//UI Components
import { Input, ButtonSocial } from "@/components/base";
import { RadioGroup } from "@headlessui/react";
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
import User from "@/lib/db/entities/User";
import CountrySelect from "../UI/CountrySelect";
import { removeUndefinedFields } from "@/util/misc";
//ValidationSchemas
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
        <h2 className=" text-xl lg:text-2xl text-white mb-6 py-2 border-b-4 border-sepia/[0.7] px-2">
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
            onChange={(val) => {
              setCountry(val?.id || null);
            }}
          />

          <SkillSelect
            onChange={(skill) => {
              setRating(skill.rating);
            }}
          />
          <button
            type="submit"
            disabled={false}
            className={`text-md ${"bg-[#b99873] hover:bg-[#a58058]"}  text-white py-2 px-6 rounded-md w-full my-2`}
          >
            Continue
          </button>
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
        <RadioGroup
          value={selected}
          onChange={(val: SkillLevel) => {
            onChange(val);
            setSelected(val);
          }}
        >
          <label className="block text-white/[0.6] text-md font-semibold mb-2" htmlFor={"country"}>
            Estimated Skill Level
          </label>
          <div className="space-y-3">
            {skillOptions.map((option) => (
              <RadioGroup.Option
                key={option.name}
                value={option}
                className={({ active, checked }) =>
                  `${active ? "ring-2 ring-white ring-opacity-60 " : ""}
                  ${checked ? "bg-sepia/[0.4] bg-opacity-75 text-white" : "bg-[#202020]"}
                    relative flex cursor-pointer rounded-lg px-3 py-2 shadow-md focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex flex-row items-center">
                          <Image
                            src={option.iconPath}
                            width={24}
                            height={20}
                            alt=""
                            className="mr-3 opacity-50"
                            style={{ filter: "invert(1)" }}
                          />
                          <RadioGroup.Label
                            as="p"
                            className={`font-semibold  ${checked ? "text-white" : "text-white/[0.8]"}`}
                          >
                            {option.name}
                          </RadioGroup.Label>
                          <RadioGroup.Description
                            as="span"
                            className={`inline ${checked ? "text-white/[0.7]" : "text-sepia/[0.7]"} ml-3 text-sm`}
                          >
                            <span>{option.description}</span>{" "}
                          </RadioGroup.Description>
                        </div>
                      </div>
                      {checked && (
                        <div className="shrink-0 text-white">
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
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
