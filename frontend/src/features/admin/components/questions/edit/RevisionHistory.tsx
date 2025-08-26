"use client";

import { useState, useEffect } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { getQuestionRevisionHistory, revertToVersion } from '@/features/admin/api/questionApi';
import { toast } from 'react-hot-toast';

interface RevisionHistoryProps {
  questionId: string;
}

interface RevisionEntry {
  version: number;
  modifiedBy: string | { _id: string; email?: string; username?: string; name?: string };
  changes: string;
  timestamp: Date;
  description: string;
}

const RevisionHistory: React.FC<RevisionHistoryProps> = ({ questionId }) => {
  const [revisionHistory, setRevisionHistory] = useState<RevisionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState<number | null>(null);

  useEffect(() => {
    const fetchRevisionHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getQuestionRevisionHistory(questionId);
        
        console.log('Raw revision history data:', data);
        
        // Ensure data is an array and handle different response formats
        let historyData: RevisionEntry[] = [];
        
        if (Array.isArray(data)) {
          historyData = data;
        } else if (data && Array.isArray(data.history)) {
          historyData = data.history;
        } else if (data && Array.isArray(data.revisions)) {
          historyData = data.revisions;
        } else if (data && typeof data === 'object') {
          // If it's a single object, wrap it in an array
          historyData = [data];
        } else {
          // If no data or unexpected format, use empty array
          historyData = [];
        }
        
        console.log('Processed history data:', historyData);
        setRevisionHistory(historyData);
      } catch (err) {
        console.error('Error fetching revision history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load revision history');
        setRevisionHistory([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchRevisionHistory();
    }
  }, [questionId]);

  const handleRevert = async (version: number) => {
    if (!confirm(`Are you sure you want to revert to version ${version}? This action cannot be undone.`)) {
      return;
    }

    try {
      setReverting(version);
      await revertToVersion(questionId, version);
      toast.success(`Successfully reverted to version ${version}`);
      // Refresh the revision history
      const data = await getQuestionRevisionHistory(questionId);
      let historyData: RevisionEntry[] = [];
      
      if (Array.isArray(data)) {
        historyData = data;
      } else if (data && Array.isArray(data.history)) {
        historyData = data.history;
      } else if (data && Array.isArray(data.revisions)) {
        historyData = data.revisions;
      } else if (data && typeof data === 'object') {
        historyData = [data];
      }
      
      setRevisionHistory(historyData);
    } catch (err) {
      console.error('Error reverting to version:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to revert to version');
    } finally {
      setReverting(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getModifiedByDisplay = (modifiedBy: string | any) => {
    if (!modifiedBy) {
      return 'Unknown';
    }
    
    // If modifiedBy is an object with email property
    if (typeof modifiedBy === 'object' && modifiedBy.email) {
      return modifiedBy.email;
    }
    
    // If modifiedBy is an object with username property
    if (typeof modifiedBy === 'object' && modifiedBy.username) {
      return modifiedBy.username;
    }
    
    // If modifiedBy is an object with name property
    if (typeof modifiedBy === 'object' && modifiedBy.name) {
      return modifiedBy.name;
    }
    
    // If modifiedBy is a string
    if (typeof modifiedBy === 'string') {
      return modifiedBy === 'Unknown' ? 'Unknown' : modifiedBy;
    }
    
    // Fallback
    return 'Unknown';
  };

  // Utility function to safely convert any value to string for rendering
  const safeString = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading revision history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block">
          <p className="text-sm font-medium">Error loading revision history</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (revisionHistory.length === 0) {
    return (
      <div className="text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">No Revision History</p>
        <p className="text-sm text-gray-500">
          This question has not been modified yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            This question has been edited <span className="font-bold">{revisionHistory.length}</span> times. Last modified by{' '}
            <span className="font-medium">{getModifiedByDisplay(revisionHistory[0]?.modifiedBy)}</span>
          </p>
        </div>
      </div>

      {/* Version List */}
      <div className="space-y-4">
        {revisionHistory.map((revision, index) => {
          try {
            // Ensure all values are safe to render
            const versionNumber = typeof revision.version === 'number' ? revision.version : index + 1;
            const description = safeString(revision.description || revision.changes || 'Content updated');
            const changes = safeString(revision.changes || revision.description || 'Content updated');
            const timestamp = revision.timestamp instanceof Date ? revision.timestamp : new Date();
            
            return (
              <div key={versionNumber} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">{versionNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{description}</h3>
                        <p className="text-xs text-gray-500">
                          Modified by {getModifiedByDisplay(revision.modifiedBy)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-11">
                      <p className="text-sm text-gray-600 mb-2">{changes}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRevert(versionNumber)}
                    disabled={reverting === versionNumber}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {reverting === versionNumber ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        Reverting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Revert to this version
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          } catch (error) {
            console.error('Error rendering revision item:', error, revision);
            return (
              <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                <p className="text-sm text-red-600">Error rendering revision item</p>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default RevisionHistory; 