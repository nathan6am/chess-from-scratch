import useSWR from "swr";
import { useEffect } from "react";
import axios from "axios";

type User = {
  name: string | undefined;
  id: string;
  type: "guest" | undefined
};
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function useUser() {
  const { data, error, isValidating, mutate } = useSWR<User, Error>(
    "/auth/user",
    fetcher
  );
  if(data) {
    const user = data
  }
  return { user: data, error, isValidating, mutate };
}
