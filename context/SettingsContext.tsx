import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Settings {
  app_key: string;
  app_secret: string;
  tracking_id: string;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  isConfigured: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "@aliaffiliate_settings";

const defaultSettings: Settings = {
  app_key: "",
  app_secret: "",
  tracking_id: "",
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setSettings(JSON.parse(val));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const updateSettings = async (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const isConfigured = !!(settings.app_key && settings.app_secret);

  const value = useMemo(
    () => ({ settings, updateSettings, isConfigured, isLoading }),
    [settings, isLoading, isConfigured]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
