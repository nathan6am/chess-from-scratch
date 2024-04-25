import { useLocalStorage } from "usehooks-ts";
import useAuth from "./queries/useAuth";
import useDebouncedCallback from "./useDebouncedCallback";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { defaultSettings, AppSettings } from "@/context/settings";
import axios from "axios";
export default function useSyncSettings() {
  const [localSettings, setLocalSettings] = useLocalStorage("app-settings", defaultSettings);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const shouldSync = user && user.type !== "guest" ? true : false;
  const {
    data: remoteSettings,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["settings", user?.id],
    queryFn: async () => {
      const res = await axios.get("/api/user/settings");
      return res.data as AppSettings;
    },
    onSuccess(data) {
      //Overwrite local settings with remote settings
      setLocalSettings({
        ...defaultSettings,
        ...data,
      });
    },
    //Only fetch if user is logged in and not a guest
    enabled: shouldSync,
    //Prevent refetching on every remount
  });
  const { mutate: updateRemoteSettings } = useMutation({
    mutationKey: ["updateRemoteSettings", user?.id],
    mutationFn: async (data: Partial<AppSettings>) => {
      const res = await axios.patch("/api/user/settings", data);
      return res.data;
    },
    onSuccess: (data) => {
      //Overwrite local settings with remote settings
      queryClient.setQueryData(["settings", user?.id], data);
    },
  });

  const debouncedMutate = useDebouncedCallback(updateRemoteSettings, 1000, [updateRemoteSettings]);

  const updateSettings = (settings: Partial<AppSettings>) => {
    //Update local settings
    setLocalSettings((currentSettings) => ({ ...currentSettings, ...settings }));
    //Update remote settings (debounced to prevent spamming the server)
    debouncedMutate(settings);
  };

  return {
    settings: localSettings,
    updateSettings,
  };
}
