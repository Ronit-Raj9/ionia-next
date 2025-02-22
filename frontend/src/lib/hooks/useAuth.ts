import { useState } from "react";
import { loginUser, registerUser, getUserProfile } from "../api/auth";

// Define the expected structure of the authentication response
interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    token: string;
    // Add more fields as necessary
  };
}

// Define User type
interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data: AuthResponse = await loginUser(email, password); // ✅ Ensure loginUser returns a typed response
      setUser(data.user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const data: AuthResponse = await registerUser(email, password, name); // ✅ Ensure registerUser returns typed data
      setUser(data.user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const profile: User = await getUserProfile(userId); // ✅ Ensure getUserProfile returns typed user data
      setUser(profile);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch profile");
      } else {
        setError("Failed to fetch profile");
      }
    }
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    fetchProfile,
    logout,
  };
};
