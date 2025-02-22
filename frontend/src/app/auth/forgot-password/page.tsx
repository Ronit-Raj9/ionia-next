"use client"; // ✅ Ensure this is the first line

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Ensure correct import

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    try {
      alert("Password reset link sent!");
      router.push("/auth/login"); // ✅ Now works properly on the client
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2>Forgot Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleReset}>Reset Password</button>
    </div>
  );
};

export default ForgotPassword;
