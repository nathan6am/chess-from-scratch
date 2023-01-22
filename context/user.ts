import React from "react";
type User = {
  name: string | undefined;
  id: string;
  type: "guest" | undefined;
};
export const UserContext = React.createContext<{
  user: User | undefined;
  refresh: (...args: any[]) => void;
}>({ user: undefined, refresh: () => {} });
