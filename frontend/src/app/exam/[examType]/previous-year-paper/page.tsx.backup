"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Paper {
  _id: string;
  title: string;
  description: string;
  // Add additional fields if needed
}

const PreviousYearPapers = () => {
  const { examType } = useParams() as { examType: string };
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`);
        if (!res.ok) {
          throw new Error("Failed to fetch papers");
        }
        const { data } = await res.json();
        setPapers(data);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error fetching papers.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Previous Year Papers</h1>
      <ul className="space-y-4">
        {papers.map((paper) => {
          console.log(`/exam/${examType}/paper/${paper._id}`);
          return (
            <li
              key={paper._id}
              className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-100"
              onClick={() => router.push(`/exam/${examType}/mock-test/${paper._id}`)}
            >
              <h2 className="text-xl font-semibold">{paper.title}</h2>
              <p>{paper.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PreviousYearPapers;
