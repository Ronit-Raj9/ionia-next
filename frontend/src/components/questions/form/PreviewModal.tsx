import React from 'react';
import { QuestionFormData } from '../utils/types';

interface PreviewModalProps {
  formData: QuestionFormData;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ formData, onConfirm, onCancel, isSubmitting }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Confirm Question Submission</h2>
        
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-semibold">Question Content</h3>
            <p>{formData.question.text || "No text provided"}</p>
            {formData.question.image?.url && <p className="text-green-600">✓ Question image attached</p>}
          </div>
          
          <div className="border-b pb-2">
            <h3 className="font-semibold">Classification</h3>
            <div className="grid grid-cols-2 gap-2">
              <p><span className="text-gray-600">Exam Type:</span> {formData.examType}</p>
              <p><span className="text-gray-600">Class:</span> {formData.class}</p>
              <p><span className="text-gray-600">Subject:</span> {formData.subject}</p>
              <p><span className="text-gray-600">Section:</span> {formData.section}</p>
              <p><span className="text-gray-600">Chapter:</span> {formData.chapter}</p>
              <p><span className="text-gray-600">Difficulty:</span> {formData.difficulty}</p>
              <p><span className="text-gray-600">Marks:</span> {formData.marks}</p>
              <p><span className="text-gray-600">Negative Marks:</span> {formData.negativeMarks}</p>
            </div>
          </div>
          
          {formData.questionType === 'numerical' ? (
            <div className="border-b pb-2">
              <h3 className="font-semibold">Numerical Answer</h3>
              <p>Exact Value: {formData.numericalAnswer?.exactValue}</p>
              <p>Acceptable Range: {formData.numericalAnswer?.range?.min} to {formData.numericalAnswer?.range?.max}</p>
              <p>Unit: {formData.numericalAnswer?.unit || "None"}</p>
            </div>
          ) : (
            <div className="border-b pb-2">
              <h3 className="font-semibold">Multiple Choice Options</h3>
              <ul className="list-disc pl-5">
                {formData.options.map((option, index) => (
                  <li key={index} className={formData.correctOptions.includes(index) ? "text-green-600 font-medium" : ""}>
                    {option.text} {formData.correctOptions.includes(index) && "✓"}
                    {option.image && " (Image attached)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="border-b pb-2">
            <h3 className="font-semibold">Solution</h3>
            <p>{formData.solution.text || "No solution text provided"}</p>
            {formData.solution.image?.url && <p className="text-green-600">✓ Solution image attached</p>}
          </div>
          
          {formData.hints.length > 0 && (
            <div className="border-b pb-2">
              <h3 className="font-semibold">Hints ({formData.hints.length})</h3>
              <ul className="list-disc pl-5">
                {formData.hints.map((hint, index) => (
                  <li key={index}>
                    {hint.text} {hint.image && "(Image attached)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {formData.tags.length > 0 && (
            <div className="border-b pb-2">
              <h3 className="font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Edit Question
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isSubmitting}
            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : (
              'Confirm & Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 