"use client";

import React from 'react';
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useQuestionStore } from '../../store/questionStore';
import { toast } from 'react-hot-toast';

export const DeleteConfirmationModal: React.FC = () => {
  const {
    showDeleteModal,
    selectedQuestionId,
    deletingId,
    setShowDeleteModal,
    setSelectedQuestionId,
    deleteQuestion
  } = useQuestionStore();

  const handleDeleteConfirm = async () => {
    if (!selectedQuestionId) return;

    try {
      await deleteQuestion(selectedQuestionId);
      toast.success('Question deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question');
    }
  };

  const handleClose = () => {
    setShowDeleteModal(false);
    setSelectedQuestionId(null);
  };

  if (!showDeleteModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Permanent Deletion</h3>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to <span className="font-bold text-red-600">permanently delete</span> this question? This action cannot be undone and all associated data will be lost.
        </p>
        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
          <p className="text-sm text-red-700">
            This will remove the question from all tests and analytics.
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            disabled={deletingId !== null}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={deletingId !== null}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 flex items-center"
          >
            {deletingId !== null ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Yes, Delete Permanently"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};