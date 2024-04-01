import React, { useState } from "react";
import { MdLogout, MdNotifications } from "react-icons/md";
import { RiListSettingsLine } from "react-icons/ri";
import OptionsOverlay from "../dialogs/OptionsOverlay";
interface Props {
  children?: JSX.Element | string | Array<JSX.Element | string>;
}
function MenuBar({ children }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const closeModal = () => {
    setShowOptions(false);
  };
  const showOptionsModal = () => {
    setShowOptions(true);
  };
  return (
    <>
      <div className="w-full z-[98] h-10 bg-elevation-2 flex flex-row justify-center items-center absolute top-0 left-0 right-0">
        <div className="flex flex-row justify-between items-center container">
          <div>{children}</div>
          {/* <div className="flex flex-row justify-start items-center">
            <button className="flex flex-row items-center justify-center p-2 rounded-md  hover:bg-elevation-4 text-light-200 hover:text-gold-100 hover:shadow-md">
              <MdNotifications className="text-xl" />
            </button>
            <button
              onClick={showOptionsModal}
              className="flex flex-row items-center justify-center p-2 rounded-md hover:bg-elevation-4 text-light-200 hover:text-gold-100 hover:shadow-md"
            >
              <RiListSettingsLine className="text-xl" />
            </button>
            <button className="flex flex-row items-center justify-center p-2 rounded-md  hover:bg-elevation-4 text-light-200 hover:text-gold-100 hover:shadow-md">
              <MdLogout className="text-xl" />
            </button>
          </div> */}
        </div>
      </div>
    </>
  );
}

export default MenuBar;
