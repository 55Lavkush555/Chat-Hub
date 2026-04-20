import { useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const TOKEN_KEY = "chat_token";

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return {
    token,
    user: user ?? null,
    isAuthenticated: !!token && !!user,
    isLoading: !!token && isUserLoading,
    login,
    logout,
  };
}
