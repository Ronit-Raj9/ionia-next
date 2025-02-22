"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

interface IUser {
  _id: string;
  email: string;
  fullName: string;
  username: string;
  role: string; // "admin" or "user", etc.
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  /**
   * checkAuth
   * - Calls /users/current-user to see if a valid session exists.
   * - Expects response JSON: { statusCode, data: { ...user fields }, ... }
   */
  const checkAuth = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/current-user`,
        { credentials: "include" }
      );
      if (!response.ok) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      const result = await response.json();
      // In your /current-user response, the user is in result.data
      const currentUser = result.data;
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // On mount, check if user is already authenticated.
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * login
   * - Calls /users/login with email and password.
   * - Expects response JSON: { statusCode, data: { user: { ... }, accessToken, refreshToken }, ... }
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const result = await response.json();
      // Here, the user object is at result.data.user
      const loggedInUser = result.data?.user;
      if (!loggedInUser) {
        throw new Error("No user object returned from login.");
      }
      setUser(loggedInUser);
      setIsAuthenticated(true);
      // Role-based redirect:
      if (loggedInUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * logout
   * - Calls /users/logout, resets local auth state, and redirects to /login.
   */
  const logout = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        // Clear non-HTTP-only cookies (if applicable)
        document.cookie =
          "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUser(null);
        setIsAuthenticated(false);
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
