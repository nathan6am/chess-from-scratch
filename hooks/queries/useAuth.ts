type AuthStatus = "guest" | "unverified" | "user" | "admin" | "unauthenticated" | "incomplete" | "loading";
import { useRouter } from "next/router";
import type { SessionUser } from "@/lib/db/entities/User";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import type User from "@/lib/db/entities/User";
import type { Profile } from "@/lib/db/entities/User";

interface Params {
  onProfileUpdate?: (profile: User) => void;
}
export default function useAuth(params?: Params) {
  const queryClient = useQueryClient();
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
    //Prevent refetching on every remount
    staleTime: 1000 * 60 * 10,
  });

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      const res = await axios.get("/api/user/profile");
      return res.data as User;
    },
    enabled: user ? true : false,
    //Prevent refetching on every remount
    staleTime: 1000 * 60 * 10,
  });

  const authStatus: AuthStatus = useMemo(() => {
    if (!user) return "unauthenticated";
    return user.type;
  }, [user]);

  function signOut() {
    router.push("/api/auth/logout");
  }

  const { mutate: updateProfile } = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: async (data: Partial<Omit<Profile, "id">>) => {
      const res = await axios.patch("/api/user/profile", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userProfile", user?.id], data);
      if (params?.onProfileUpdate) params.onProfileUpdate(data);
    },
  });
  return {
    signOut,
    refetch,
    isError,
    isLoading,
    user,
    profile,
    updateProfile,
    authStatus,
  };
}
