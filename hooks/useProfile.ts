import useSWR from "swr";
import { useEffect } from "react";
import axios from "axios";
import User, { SessionUser } from "@/lib/db/entities/User";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useProfile() {
  const { data, error, isValidating, mutate } = useSWR<User, Error>(
    "/api/user/profile",
    fetcher
  );
  return { user: data, error, isValidating, mutate };
}
