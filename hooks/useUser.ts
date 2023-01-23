import useSWR from "swr";
import { useEffect } from "react";
import axios from "axios";
import { SessionUser } from "@/lib/db/entities/user";
type User = {
  name: string | undefined;
  id: string;
  type: "guest" | undefined;
};
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useUser() {
  const { data, error, isValidating, mutate } = useSWR<SessionUser, Error>("/api/auth/user", fetcher);
  if (data) {
    const user = data;
  }
  return { user: data, error, isValidating, mutate };
}
