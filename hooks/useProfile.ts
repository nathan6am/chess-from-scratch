import useSWR from "swr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import User, { SessionUser } from "@/lib/db/entities/User";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useProfile() {
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery<SessionUser, Error>(["profile"], {
    queryFn: () => axios.get("/api/user/profile").then((res) => res.data),
  });
  const updateProfile = useMutation(["update-profile"], {
    mutationFn: (data: User) => axios.put("/api/user/profile", data).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });
  return { profile, refetch, isLoading, updateProfile };
}
