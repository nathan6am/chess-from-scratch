import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
interface MenuItemProps {
  children?: string | JSX.Element | Array<string | JSX.Element>;
  disabled?: boolean;
  onClick: any;
}
export function MenuItem({ children, disabled, onClick }: MenuItemProps) {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={onClick}
          className={`${
            active ? "bg-white/[0.1] text-white" : "text-white/[0.8]"
          } group flex flex-row w-full  px-2 py-2 text-sm ${disabled ? "pointer-none text-white/[0.3]" : ""}`}
        >
          {children}
        </button>
      )}
    </Menu.Item>
  );
}

interface MenuButtonProps {
  children: string | JSX.Element | Array<string | JSX.Element>;
  disabled?: boolean;
}
export function MenuButton({ children }: MenuButtonProps) {
  return (
    <Menu.Button className="inline-flex w-full justify-center px-4 py-2  hover:text-gold-100 text-light-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
      {children}
    </Menu.Button>
  );
}

export function MenuWrapper({ children }: { children: JSX.Element | Array<JSX.Element> }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {children}
    </Menu>
  );
}

export function MenuItems({ children }: { children: JSX.Element | Array<JSX.Element> }) {
  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items className="absolute left-0 z-[100] mt-1 w-56 origin-top-right divide-y divide-gray-100/[0.1] rounded-sm overflow-hidden bg-elevation-3 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        {children}
      </Menu.Items>
    </Transition>
  );
}
