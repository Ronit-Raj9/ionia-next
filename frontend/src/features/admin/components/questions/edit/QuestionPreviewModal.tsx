"use client";

import React from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Question } from '@/features/admin/types';
import CloudinaryImage from '../components/CloudinaryImage';

interface QuestionPreviewModalProps {
  originalQuestion: Question;
  updatedData: any;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  originalQuestion,
  updatedData,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  // Helper function to check if a field has changed
  const hasFieldChanged = (originalValue: any, updatedValue: any): boolean => {
    // Handle null/undefined cases
    if (originalValue === null || originalValue === undefined) {
      return updatedValue !== null && updatedValue !== undefined;
    }
    if (updatedValue === null || updatedValue === undefined) {
      return originalValue !== null && originalValue !== undefined;
    }
    
    // Handle arrays
    if (Array.isArray(originalValue) && Array.isArray(updatedValue)) {
      if (originalValue.length !== updatedValue.length) return true;
      return originalValue.some((item, index) => hasFieldChanged(item, updatedValue[index]));
    }
    
    // Handle objects
    if (typeof originalValue === 'object' && typeof updatedValue === 'object') {
      const originalKeys = Object.keys(originalValue);
      const updatedKeys = Object.keys(updatedValue);
      
      if (originalKeys.length !== updatedKeys.length) return true;
      
      return originalKeys.some(key => hasFieldChanged(originalValue[key], updatedValue[key]));
    }
    
    // Handle primitive values
    return originalValue !== updatedValue;
  };

  // Get only the changed fields
  const getChangedFields = () => {
    const changes: { field: string; original: any; updated: any }[] = [];
    
    // Check question text
    if (hasFieldChanged(originalQuestion.question?.text, updatedData.question?.text)) {
      changes.push({ 
        field: 'Question Text', 
        original: originalQuestion.question?.text, 
        updated: updatedData.question?.text 
      });
    }
    
    // Check question image
    if (hasFieldChanged(originalQuestion.question?.image, updatedData.question?.image)) {
      changes.push({ 
        field: 'Question Image', 
        original: originalQuestion.question?.image, 
        updated: updatedData.question?.image 
      });
    }
    
    // Check options - more detailed comparison
    if (originalQuestion.options && updatedData.options) {
      const optionsChanged = originalQuestion.options.length !== updatedData.options.length ||
        originalQuestion.options.some((originalOption: any, index: number) => {
          const updatedOption = updatedData.options[index];
          if (!updatedOption) return true;
          return hasFieldChanged(originalOption.text, updatedOption.text) ||
                 hasFieldChanged(originalOption.image, updatedOption.image);
        });
      
      if (optionsChanged) {
        changes.push({ 
          field: 'Options', 
          original: originalQuestion.options, 
          updated: updatedData.options 
        });
      }
    }
    
    // Check correct options - array comparison
    if (originalQuestion.correctOptions || updatedData.correctOptions) {
      const originalCorrect = originalQuestion.correctOptions || [];
      const updatedCorrect = updatedData.correctOptions || [];
      
      if (originalCorrect.length !== updatedCorrect.length ||
          !originalCorrect.every((val: number, index: number) => val === updatedCorrect[index])) {
        changes.push({ 
          field: 'Correct Options', 
          original: originalQuestion.correctOptions, 
          updated: updatedData.correctOptions 
        });
      }
    }
    
    // Check solution
    if (hasFieldChanged(originalQuestion.solution?.text, updatedData.solution?.text)) {
      changes.push({ 
        field: 'Solution', 
        original: originalQuestion.solution?.text, 
        updated: updatedData.solution?.text 
      });
    }
    
    // Check solution image
    if (hasFieldChanged(originalQuestion.solution?.image, updatedData.solution?.image)) {
      changes.push({ 
        field: 'Solution Image', 
        original: originalQuestion.solution?.image, 
        updated: updatedData.solution?.image 
      });
    }
    
    // Check metadata fields
    const metadataFields = ['subject', 'chapter', 'difficulty', 'marks'];
    metadataFields.forEach(field => {
      if (hasFieldChanged(originalQuestion[field as keyof Question], updatedData[field])) {
        changes.push({ 
          field: field.charAt(0).toUpperCase() + field.slice(1), 
          original: originalQuestion[field as keyof Question], 
          updated: updatedData[field] 
        });
      }
    });
    
    // Check tags
    if (hasFieldChanged(originalQuestion.tags, updatedData.tags)) {
      changes.push({ 
        field: 'Tags', 
        original: originalQuestion.tags, 
        updated: updatedData.tags 
      });
    }
    
    // Check related topics
    if (hasFieldChanged((originalQuestion as any).relatedTopics, updatedData.relatedTopics)) {
      changes.push({ 
        field: 'Related Topics', 
        original: (originalQuestion as any).relatedTopics, 
        updated: updatedData.relatedTopics 
      });
    }
    
    return changes;
  };

  const changedFields = getChangedFields();

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      {/* Floating Popup - Restaurant Style */}
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[600px] shadow-2xl border border-gray-200 transform transition-all duration-300 ease-out relative overflow-hidden flex flex-col" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          title="Close Preview"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header Section */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden flex-shrink-0">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl mr-4">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Question Preview</h1>
                <p className="text-blue-100 text-sm mt-1">
                  Review your changes before saving
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 py-6 flex-1 overflow-y-auto min-h-0">
          {changedFields.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Changes Detected</h3>
              <p className="text-gray-600">No modifications were made to this question.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-lg font-semibold text-gray-800">
                  {changedFields.length} Field{changedFields.length !== 1 ? 's' : ''} Updated
                </span>
              </div>
              
              {changedFields.map((change, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mr-2">
                      Updated
                    </span>
                    {change.field}
                  </h4>
                  
                  {/* Question Text */}
                  {change.field === 'Question Text' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">New Text:</label>
                        <p className="text-gray-800 bg-white p-3 rounded-lg border">
                          {change.updated || 'No text provided'}
                        </p>
                      </div>
                      {change.updated?.image?.url && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">Image:</label>
                          <CloudinaryImage
                            src={change.updated.image.url}
                            alt="Question Image"
                            className="w-full h-32 object-contain rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Options */}
                  {change.field === 'Options' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Updated Options:</label>
                      {change.updated?.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="bg-white p-3 rounded-lg border flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            change.updated?.correctOptions?.includes(optIndex)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800">{option.text || 'No text'}</p>
                            {option.image?.url && (
                              <CloudinaryImage
                                src={option.image.url}
                                alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className="w-24 h-16 object-contain rounded mt-2"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Correct Options */}
                  {change.field === 'Correct Options' && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-2">Correct Answer(s):</label>
                      <div className="flex space-x-2">
                        {change.updated?.map((index: number) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            <Check className="h-3 w-3 mr-1" />
                            Option {String.fromCharCode(65 + index)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Solution */}
                  {change.field === 'Solution' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">Solution Text:</label>
                        <p className="text-gray-800 bg-white p-3 rounded-lg border">
                          {change.updated || 'No solution provided'}
                        </p>
                      </div>
                      {change.updated?.image?.url && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 block mb-1">Solution Image:</label>
                          <CloudinaryImage
                            src={change.updated.image.url}
                            alt="Solution Image"
                            className="w-full h-32 object-contain rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Simple fields (subject, chapter, difficulty, marks, tags, etc.) */}
                  {!['Question Text', 'Options', 'Correct Options', 'Solution'].includes(change.field) && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1">New Value:</label>
                        <div className="bg-white p-3 rounded-lg border">
                          {Array.isArray(change.updated) ? (
                            <div className="flex flex-wrap gap-2">
                              {change.updated.map((item: string, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              change.field === 'Difficulty' ? (
                                change.updated === 'easy' ? 'bg-green-100 text-green-800' :
                                change.updated === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              ) : 'bg-gray-100 text-gray-800'
                            }`}>
                              {change.field === 'Difficulty' ? change.updated?.toUpperCase() : change.updated}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {changedFields.length > 0 ? (
                <span className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                  {changedFields.length} change{changedFields.length !== 1 ? 's' : ''} will be saved
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" />
                  No changes to save
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreviewModal;
