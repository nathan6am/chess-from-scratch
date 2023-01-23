import React from "react";
import { SessionUser } from "@/lib/db/entities/user";
export const UserContext = React.createContext<{
  user: SessionUser | undefined;
  refresh: (...args: any[]) => void;
}>({ user: undefined, refresh: () => {} });
