"use client";

import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { Loader2, GitCommit, ChevronDown, ChevronUp, User, History } from "lucide-react";
import { toast } from "react-hot-toast";

interface RevisionProps {
  questionId: string;
}

interface Revision {
  _id: string;
  version: number;
  modifiedBy: {
    _id: string;
    username: string;
    email: string;
  };
  changes: string;
  timestamp: string;
}

interface DetailedHistory {
  revisions: Revision[];
  lastModified: {
    by: {
      _id: string;
      name: string;
      email: string;
    };
    at: string;
  };
  totalRevisions: number;
}

const RevisionHistory: React.FC<RevisionProps> = ({ questionId }) => {
  const [history, setHistory] = useState<DetailedHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}/change-history`;
        
        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch revision history");
        }

        const result = await response.json();
        setHistory(result.data);
      } catch (err) {
        console.error("Error fetching revision history:", err);
        setError(err instanceof Error ? err.message : "Failed to load revision history");
        toast.error("Failed to load revision history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [questionId]);

  const handleToggleExpand = (version: number) => {
    if (expandedVersion === version) {
      setExpandedVersion(null);
    } else {
      setExpandedVersion(version);
    }
  };

  const handleRevert = async (version: number) => {
    if (!confirm(`Are you sure you want to revert to version ${version}? This will create a new revision.`)) {
      return;
    }

    try {
      setLoading(true);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}/revert/${version}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to revert to this version");
      }

      toast.success(`Successfully reverted to version ${version}`);
      
      // Refresh the history
      const historyUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}/change-history`;
      const historyResponse = await fetch(historyUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (historyResponse.ok) {
        const result = await historyResponse.json();
        setHistory(result.data);
      }
      
    } catch (err) {
      console.error("Error reverting to version:", err);
      toast.error(err instanceof Error ? err.message : "Failed to revert to this version");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isValid(date) ? format(date, "PPP 'at' p") : 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading revision history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-lg">
        <p className="font-medium">Error loading revision history</p>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (!history || !history.revisions || history.revisions.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No revision history available for this question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-blue-800 flex items-center">
          <History className="h-5 w-5 mr-2" />
          This question has been edited <span className="font-semibold mx-1">{history?.totalRevisions}</span> times.
          {history?.lastModified?.by && (
            <span className="ml-1">
              Last modified by <span className="font-semibold">{history.lastModified.by.name}</span>
              {history.lastModified.at && (
                <span className="ml-1">on {formatDate(history.lastModified.at)}</span>
              )}
            </span>
          )}
        </p>
      </div>
      
      <div className="space-y-4">
        {history.revisions.map((revision) => (
          <div 
            key={revision._id || revision.version}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Version {revision.version}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(revision.timestamp)}
              </span>
            </div>
            <p className="text-gray-800">{revision.changes}</p>
            <p className="text-sm text-gray-600 mt-2">
              Modified by: <span className="font-medium">{revision.modifiedBy?.username || "Unknown"}</span>
            </p>
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRevert(revision.version);
                }}
                className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition-colors"
                disabled={loading}
              >
                Revert to this version
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionHistory; 