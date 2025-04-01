"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, GitCommit, ChevronDown, ChevronUp, User } from "lucide-react";
import { toast } from "react-hot-toast";

interface RevisionProps {
  questionId: string;
}

interface Revision {
  _id: string;
  version: number;
  modifiedBy: {
    _id: string;
    name: string;
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
    <div className="p-4">
      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="text-blue-800 font-medium mb-2 flex items-center">
          <GitCommit className="mr-2 h-5 w-5" />
          Revision Summary
        </h3>
        <p className="text-blue-700">
          This question has been edited <span className="font-semibold">{history.totalRevisions}</span> times.
          {history.lastModified?.by && (
            <span> Last modified by <span className="font-semibold">{history.lastModified.by.name}</span> on {format(new Date(history.lastModified.at), "PPP 'at' p")}</span>
          )}
        </p>
      </div>
      
      <div className="space-y-4">
        {history.revisions.map((revision) => (
          <div 
            key={revision._id || revision.version}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => handleToggleExpand(revision.version)}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                  <span className="text-sm font-medium">{revision.version}</span>
                </div>
                <div>
                  <p className="font-medium">Version {revision.version}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(revision.timestamp), "PPP 'at' p")}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {expandedVersion === revision.version ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedVersion === revision.version && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="mb-4">
                  <div className="flex items-center text-gray-700 mb-2">
                    <User className="h-4 w-4 mr-2" /> 
                    <span className="font-medium">Modified by:</span>
                    <span className="ml-2">{revision.modifiedBy?.name || "Unknown"}</span>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Changes:</h4>
                    <p className="text-gray-600">{revision.changes || "No change description available"}</p>
                  </div>
                </div>
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionHistory; 