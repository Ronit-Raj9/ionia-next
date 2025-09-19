"use client";

import React, { useEffect } from 'react';
import { Calendar, User, Clock, FileText, RotateCcw, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Card, CardContent } from '@/shared/components/ui/card';
import LoadingSpinner from '../../analytics/LoadingSpinner';

interface RevisionHistoryItem {
  _id: string;
  version: number;
  timestamp: string;
  modifiedBy: {
    _id: string;
    username: string;
    email: string;
  };
  changesDescription: string;
}

interface RevisionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  revisionHistory: RevisionHistoryItem[];
  loading: boolean;
  onLoadHistory: () => void;
  onRevertVersion?: (versionId: string) => void;
  className?: string;
}

const RevisionHistoryPanel: React.FC<RevisionHistoryPanelProps> = ({
  isOpen,
  onClose,
  revisionHistory,
  loading,
  onLoadHistory,
  onRevertVersion,
  className = ''
}) => {
  useEffect(() => {
    if (isOpen && revisionHistory.length === 0 && !loading) {
      onLoadHistory();
    }
  }, [isOpen, revisionHistory.length, loading, onLoadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getVersionBadge = (version: number, isLatest: boolean) => {
    if (isLatest) {
      return <Badge className="bg-green-600">Current</Badge>;
    }
    return <Badge variant="outline">v{version}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[80vh] ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Revision History
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner message="Loading revision history..." />
            </div>
          ) : revisionHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No revision history found
              </h3>
              <p className="text-gray-600">
                This test hasn't been modified since creation.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {revisionHistory.map((revision, index) => {
                  const isLatest = index === 0;
                  const { date, time } = formatDate(revision.timestamp);
                  
                  return (
                    <Card 
                      key={revision._id} 
                      className={`transition-all duration-200 ${
                        isLatest ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Version Header */}
                            <div className="flex items-center gap-3">
                              {getVersionBadge(revision.version, isLatest)}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {date}
                                <Clock className="h-4 w-4 ml-2" />
                                {time}
                              </div>
                            </div>

                            {/* Author Information */}
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">
                                  {revision.modifiedBy.username}
                                </span>
                                <span className="text-gray-500 ml-2">
                                  ({revision.modifiedBy.email})
                                </span>
                              </div>
                            </div>

                            {/* Changes Description */}
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Changes Made:
                              </h4>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {revision.changesDescription || 'No description provided'}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          {!isLatest && onRevertVersion && (
                            <div className="ml-4 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRevertVersion(revision._id)}
                                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Revert
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Divider for non-latest versions */}
                        {!isLatest && index < revisionHistory.length - 1 && (
                          <div className="mt-4 border-b border-gray-100" />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {revisionHistory.length > 0 && (
                <>Showing {revisionHistory.length} revision{revisionHistory.length !== 1 ? 's' : ''}</>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onLoadHistory}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RevisionHistoryPanel;