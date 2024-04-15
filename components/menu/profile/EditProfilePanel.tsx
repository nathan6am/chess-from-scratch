import useProfile from "@/hooks/useProfile";
import { PanelHeader } from "@/components/base/Typography";
import { MdEdit } from "react-icons/md";
import React from "react";
import { Input } from "@/components/base";
import { Label } from "@/components/base/Typography";
import { GiBulletBill, GiRabbit, GiTurtle } from "react-icons/gi";
import { FaFire } from "react-icons/fa";
export default function EditProfilePanel() {
  const { user, updateProfile } = useProfile();
  return (
    <div className="flex flex-col w-full h-full">
      <PanelHeader className="px-4 py-2 bg-elevation-3"> Profile</PanelHeader>
      <div className="flex flex-col w-full h-full p-2">
        <div className="flex flex-col p-2">
          <Label className="mr-2">Username:</Label>
          <p className="text-gold-200 mb-0.5">{user?.username}</p>
        </div>
        <div className="flex flex-col p-2">
          <Label className="mr-2">Name:</Label>
          <p className="text-gold-200 mb-0.5">{user?.name}</p>
        </div>

        <div className="flex  flex-col p-2">
          <Label className="mr-2">Country:</Label>
          {user?.profile.country ? (
            <p className="text-gold-200 mb-0.5">
              <span className="w-6 inline mr-2">
                <img
                  src={`/assets/flags/${user?.profile.country?.toLowerCase()}.svg`}
                  className="w-6 inline"
                  height="auto"
                ></img>
              </span>
              {user?.profile.country}
            </p>
          ) : (
            <p className="text-light-400"></p>
          )}
        </div>
        <div className="flex flex-col  p-2">
          <Label className="w-full text-left">Bio:</Label>
          <textarea
            rows={5}
            className="w-full my-3 rounded-md border border-white/[0.2] bg-[#161616] px-2 py-1 text-sm text-white/[0.7]"
            value={user?.profile.bio}
            disabled={true}
          ></textarea>
        </div>
        <Label className="mt-2 px-2">Current Ratings:</Label>

        <div className="px-2 gap-y-4 mb-4">
          <p className="font-semibold text-gold-200 mb-1">
            <span className="text-light-200 font-medium">
              <GiBulletBill className="inline mr-2" />
              Bullet:
            </span>{" "}
            {user?.ratings.bullet.rating}
          </p>
          <p className="font-semibold text-gold-200 mb-1">
            <span className="text-light-200 font-medium">
              <FaFire className="inline mr-2" />
              Blitz:
            </span>{" "}
            {user?.ratings.blitz.rating}
          </p>
          <p className="font-semibold text-gold-200 mb-1">
            <span className="text-light-200 font-medium">
              <GiRabbit className="inline mr-2" />
              Rapid:
            </span>{" "}
            {user?.ratings.rapid.rating}
          </p>
          <p className="font-semibold text-gold-200 mb-1">
            <span className="text-light-200 font-medium">
              <GiTurtle className="inline mr-2" />
              Classical:
            </span>{" "}
            {user?.ratings.classical.rating}
          </p>
        </div>
      </div>
    </div>
  );
}
