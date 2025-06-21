"use client";

import React, { useState } from "react";
import Button from "@/shared/components/common/Button";
import { Input } from "@/shared/components/common/Input";
import { registerUser } from "../api/authApi"; // Adjust the import path as necessary
import { useRouter } from "next/navigation";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await registerUser({ 
        fullName: name, 
        email, 
        username: email.split('@')[0], // Generate a default username from email
        password 
      });
      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed. Please try again.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold">Register</h2>
      {error && <p className="text-red-600">{error}</p>}

      <Input
        label="Name" // ✅ Now using label instead of placeholder
        type="text"
        placeholder="Enter your name" // ✅ Now supported
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit">Register</Button>
    </form>
  );
};

export default RegisterForm;
