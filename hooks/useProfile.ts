import useSWR from "swr";
import { useEffect } from "react";
import axios from "axios";
import { SessionUser } from "@/lib/db/entities/user";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useProfile() {
  const { data, error, isValidating, mutate } = useSWR<any, Error>("/api/user/profile", fetcher);
  return { user: data, error, isValidating, mutate };
}
