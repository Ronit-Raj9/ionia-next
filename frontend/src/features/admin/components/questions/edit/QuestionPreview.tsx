import React from 'react';
import Image from 'next/image';
import { Question, QuestionUpdateData } from '@/types/question';

interface QuestionPreviewProps {
  originalQuestion: Question;
  updatedData: QuestionUpdateData;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  originalQuestion,
  updatedData,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  // Helper function to check if a field has changed
  const hasFieldChanged = (key: string, original: any, updated: any): boolean => {
    if (typeof original === 'object' && original !== null) {
      return JSON.stringify(original) !== JSON.stringify(updated);
    }
    return original !== updated;
  };

  // Get all changed fields
  const getChangedFields = () => {
    const changes: Record<string, { old: any; new: any }> = {};

    Object.keys(updatedData).forEach((key) => {
      if (hasFieldChanged(key, originalQuestion[key as keyof Question], updatedData[key as keyof QuestionUpdateData])) {
        changes[key] = {
          old: originalQuestion[key as keyof Question],
          new: updatedData[key as keyof QuestionUpdateData]
        };
      }
    });

    return changes;
  };

  const changedFields = getChangedFields();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Review Changes</h2>
          <p className="mt-2 text-gray-600">
            Please review the following changes before submitting:
          </p>
        </div>

        <div className="p-6">
          {Object.keys(changedFields).length === 0 ? (
            <p className="text-gray-700">No changes detected.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(changedFields).map(([field, values]) => (
                <div key={field} className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Original</h4>
                      {field === 'question' || field === 'solution' ? (
                        <div>
                          <p className="text-gray-700">{values.old.text}</p>
                          {values.old.image?.url && (
                            <div className="mt-2 relative h-40">
                              <Image
                                src={values.old.image.url}
                                alt="Original"
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          )}
                        </div>
                      ) : field === 'options' ? (
                        <div className="space-y-2">
                          {values.old.map((option: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                              <span>{option.text}</span>
                              {option.image?.url && (
                                <div className="relative h-20 w-20">
                                  <Image
                                    src={option.image.url}
                                    alt={`Option ${index + 1}`}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(values.old, null, 2)}
                        </pre>
                      )}
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Updated</h4>
                      {field === 'question' || field === 'solution' ? (
                        <div>
                          <p className="text-gray-700">{values.new.text}</p>
                          {values.new.image?.url && (
                            <div className="mt-2 relative h-40">
                              <Image
                                src={values.new.image.url}
                                alt="Updated"
                                fill
                                className="object-contain rounded"
                              />
                            </div>
                          )}
                        </div>
                      ) : field === 'options' ? (
                        <div className="space-y-2">
                          {values.new.map((option: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                              <span>{option.text}</span>
                              {option.image?.url && (
                                <div className="relative h-20 w-20">
                                  <Image
                                    src={option.image.url}
                                    alt={`Option ${index + 1}`}
                                    fill
                                    className="object-contain rounded"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(values.new, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            disabled={isSubmitting || Object.keys(changedFields).length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview; 