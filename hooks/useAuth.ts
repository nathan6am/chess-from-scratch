type AuthStatus = "guest" | "unverified" | "user" | "admin" | "unauthenticated" | "incomplete" | "loading";
import { useRouter } from "next/router";
import type { SessionUser } from "@/lib/db/entities/User";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import type User from "@/lib/db/entities/User";

export default function useAuth() {
  const router = useRouter();
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["sessionUser"],
    queryFn: async () => {
      const res = await axios.get("/api/auth/user");
      if (res.data) {
        return res.data as SessionUser;
      } else {
        return undefined;
      }
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const res = await axios.get("/api/user/profile");
      return res.data as User;
    },
    enabled: user ? true : false,
  });

  const authStatus: AuthStatus = useMemo(() => {
    if (!user) return "unauthenticated";
    return user.type;
  }, [user]);

  function signOut() {}

  function updateProfile() {}
  return {
    refetch,
    isError,
    isLoading,
    user,
    profile,
    authStatus,
  };
}
