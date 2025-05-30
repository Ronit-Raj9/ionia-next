import React from 'react';
import { QuestionFormData } from './utils/types';
import Image from 'next/image';

interface PreviewQuestionProps {
  formData: QuestionFormData;
  onSubmit: () => void;
  onEdit: () => void;
}

const PreviewQuestion: React.FC<PreviewQuestionProps> = ({
  formData,
  onSubmit,
  onEdit,
}) => {
  const renderOptions = () => {
    if (formData.questionType === 'numerical') {
      return (
        <div className="mt-4">
          <h3 className="font-medium text-gray-700">Numerical Answer Details:</h3>
          <div className="ml-4">
            <p>Exact Value: {formData.numericalAnswer?.exactValue}</p>
            <p>Range: {formData.numericalAnswer?.range.min} to {formData.numericalAnswer?.range.max}</p>
            {formData.numericalAnswer?.unit && <p>Unit: {formData.numericalAnswer.unit}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4">
        <h3 className="font-medium text-gray-700">Options:</h3>
        <div className="space-y-2 ml-4">
          {formData.options?.map((option, index) => (
            <div 
              key={index}
              className={`p-2 rounded ${
                formData.correctOptions.includes(index) 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                <div className="flex-1">
                  {option.text && <p>{option.text}</p>}
                  {option.image?.url && (
                    <div className="mt-2">
                      <Image
                        src={option.image.url}
                        alt={`Option ${String.fromCharCode(65 + index)}`}
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  console.log(formData);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Question Preview</h2>
        <p className="text-sm text-gray-500">Review your question before final submission</p>
      </div>

      {/* Question Content */}
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-700">Question:</h3>
          <div className="mt-2">
            {formData.question.text && (
              <div className="prose max-w-none">
                {formData.question.text}
              </div>
            )}
            {formData.question.image?.url && (
              <div className="mt-4">
                <Image
                  src={formData.question.image.url}
                  alt="Question"
                  width={400}
                  height={400}
                  className="rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Options or Numerical Answer */}
        {renderOptions()}

        {/* Solution */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-700">Solution:</h3>
          <div className="mt-2 ml-4">
            {formData.solution.text && (
              <div className="prose max-w-none">
                {formData.solution.text}
              </div>
            )}
            {formData.solution.image?.url && (
              <div className="mt-4">
                <Image
                  src={formData.solution.image.url}
                  alt="Solution"
                  width={400}
                  height={400}
                  className="rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Hints */}
        {formData.hints.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-700">Hints:</h3>
            <div className="space-y-4 ml-4">
              {formData.hints.map((hint, index) => (
                <div key={index} className="bg-yellow-50 p-4 rounded">
                  <p className="font-medium">Hint {index + 1}:</p>
                  {hint.text && <p className="mt-1">{hint.text}</p>}
                  {hint.image?.url && (
                    <div className="mt-2">
                      <Image
                        src={hint.image.url}
                        alt={`Hint ${index + 1}`}
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Details */}
        <div className="mt-8 grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded">
          <div>
            <h3 className="font-medium text-gray-700 mb-4">Classification:</h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-32 text-gray-600">Exam Type:</dt>
                <dd>{formData.examType}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Class:</dt>
                <dd>{formData.class}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Subject:</dt>
                <dd>{formData.subject}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Chapter:</dt>
                <dd>{formData.chapter}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Section:</dt>
                <dd>{formData.section}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-4">Settings:</h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="w-32 text-gray-600">Difficulty:</dt>
                <dd>{formData.difficulty}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Marks:</dt>
                <dd>{formData.marks}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Negative Marks:</dt>
                <dd>{formData.negativeMarks}</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Expected Time:</dt>
                <dd>{formData.expectedTime} seconds</dd>
              </div>
              <div className="flex">
                <dt className="w-32 text-gray-600">Language:</dt>
                <dd>{formData.language}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Tags and Topics */}
        {(formData.tags.length > 0 || formData.relatedTopics.length > 0) && (
          <div className="mt-6">
            {formData.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.relatedTopics.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Related Topics:</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.relatedTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          type="button"
          onClick={onEdit}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Edit Question
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Submit Question
        </button>
      </div>
    </div>
  );
};

export default PreviewQuestion; 