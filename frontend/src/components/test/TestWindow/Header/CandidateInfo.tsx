"use client";

import React, { useEffect, useState } from "react";

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";")[0] || null;
  return null;
}

const CandidateInfo: React.FC = () => {
  const [candidate, setCandidate] = useState<{ name: string; username: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = getCookie("accessToken");
      if (token) {
        try {
          // Decode the JWT (assuming it's a base64 encoded JSON payload)
          const decodedToken = JSON.parse(atob(token.split(".")[1]));
          const candidateName = decodedToken.fullName || "Unknown";
          const username = decodedToken.username || "";
          setCandidate({ name: candidateName, username });
          console.log("Candidate info:", candidateName, username);
        } catch (error) {
          console.error("Failed to decode token:", error);
          setCandidate(null);
        }
      }
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-md shadow-sm">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : candidate ? (
        <>
          <h3 className="text-lg font-semibold text-gray-800">{candidate.name}</h3>
          <p className="text-sm text-gray-600">User id: {candidate.username}</p>
        </>
      ) : (
        <p className="text-center text-gray-500">No candidate info available.</p>
      )}
    </div>
  );
};

export default CandidateInfo;
