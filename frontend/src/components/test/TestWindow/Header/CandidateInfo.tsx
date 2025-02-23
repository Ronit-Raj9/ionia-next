"use client";

import React, { useEffect, useState } from "react";

const CandidateInfo: React.FC = () => {
  const [candidate, setCandidate] = useState<{ name: string; username: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/current-user`, {
          credentials: "include", // Ensures cookies (session) are sent with the request
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const result = await response.json();
        const currentUser = result.data;

        if (currentUser) {
          setCandidate({
            name: currentUser.fullName || "Unknown",
            username: currentUser.username || "",
          });
        } else {
          setCandidate(null);
        }
      } catch (error) {
        console.error("Error fetching candidate info:", error);
        setCandidate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
