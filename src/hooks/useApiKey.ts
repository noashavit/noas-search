import { useState, useEffect } from "react";

const STORAGE_KEY = "serpapi_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  });

  const setApiKey = (key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setApiKeyState("");
  };

  return { apiKey, setApiKey, clearApiKey, hasApiKey: !!apiKey };
}
