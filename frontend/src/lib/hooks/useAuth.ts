import { useState } from "react";
import { loginUser, registerUser, getUserProfile } from "../api/auth";

// Define the expected structure of the authentication response
interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    name?: string; // Make name optional
    // Add more fields as necessary
  };
  accessToken: string;
  refreshToken?: string; // Make refreshToken optional
}

// Define User type
interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  name?: string; // Make name optional
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data: AuthResponse = await loginUser(email, password);
      // Create a user object that includes the accessToken
      setUser({
        ...data.user,
        accessToken: data.accessToken
      });
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

  const register = async (userData: { fullName: string; email: string; username: string; password: string }) => {
    setLoading(true);
    try {
      const data: AuthResponse = await registerUser(userData);
      // Create a user object that includes the accessToken
      setUser({
        ...data.user,
        accessToken: data.accessToken
      });
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
