import useSWR from "swr";
import { useEffect } from "react";
import axios from "axios";

type User = {
  name: string | undefined;
  id: string;
};
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useUser(): {
  user: User | undefined;
  error: Error | undefined;
} {
  const { data, error } = useSWR<User, Error>("/auth/user", fetcher);
  return { user: data, error };
}
