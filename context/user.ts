import React from "react";
type User = {
  name: string | undefined;
  id: string;
};
export const UserContext = React.createContext<User | undefined>(undefined);
