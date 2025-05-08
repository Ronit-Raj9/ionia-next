import React from 'react';
import { QuestionFormData } from '../../utils/types';
import { Badge } from '@/components/ui/badge';

interface QuestionPreviewProps {
  formData: QuestionFormData;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({ formData }) => {
  // Remove the console logs once fixed
  console.log("Question text:", formData.question.text);
  
  return (
    <div className="space-y-8 w-full">
      {/* Question Content Section */}
      <PreviewSection title="Question Content">
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              {formData.question.text && (
                <div className="prose max-w-none text-lg">
                  <p className="text-gray-800">{formData.question.text}</p>
                </div>
              )}
            </div>
            {formData.question.image?.url && (
              <div className="flex-shrink-0">
                <img 
                  src={formData.question.image.url} 
                  alt="Question" 
                  className="max-w-[300px] rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              {formData.questionType === 'numerical' ? 'Numerical' : 
               formData.questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
            </Badge>
            <Badge variant={formData.questionSource === 'pyq' ? "default" : "outline"} className="text-sm px-3 py-1">
              {formData.questionSource === 'pyq' ? 'Previous Year Question' : 
               formData.questionSource === 'custom' ? 'Custom Question' :
               formData.questionSource === 'india_book' ? 'Indian Book' : 
               formData.questionSource === 'foreign_book' ? 'Foreign Book' : 'Other Source'}
            </Badge>
          </div>
        </div>
      </PreviewSection>

      {/* Classification Section */}
      <PreviewSection title="Classification">
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <PreviewField label="Exam Type" value={formData.examType} />
          <PreviewField label="Class" value={formData.class} />
          <PreviewField label="Subject" value={formData.subject} />
          {formData.section && <PreviewField label="Section" value={formData.section} />}
          <PreviewField label="Chapter" value={formData.chapter} />
          <PreviewField label="Difficulty" value={formData.difficulty} />
          <PreviewField label="Marks" value={formData.marks.toString()} />
          <PreviewField label="Negative Marks" value={formData.negativeMarks.toString()} />
          <PreviewField label="Expected Time" value={`${formData.expectedTime} seconds`} />
          {formData.questionSource === 'pyq' && (
            <PreviewField label="Year" value={formData.year || 'Not specified'} />
          )}
          {formData.language && <PreviewField label="Language" value={formData.language} />}
          {formData.languageLevel && <PreviewField label="Language Level" value={formData.languageLevel} />}
        </div>
      </PreviewSection>

      {/* Answer Section */}
      {formData.questionType === 'numerical' ? (
        <PreviewSection title="Numerical Answer">
          <div className="space-y-4 px-3 py-2 bg-gray-50 rounded-lg">
            {formData.numericalAnswer && (
              <>
                <PreviewField label="Exact Value" value={formData.numericalAnswer.exactValue.toString()} />
                <PreviewField 
                  label="Acceptable Range" 
                  value={`${formData.numericalAnswer.range.min} to ${formData.numericalAnswer.range.max}`} 
                />
                {formData.numericalAnswer.unit && (
                  <PreviewField label="Unit" value={formData.numericalAnswer.unit} />
                )}
              </>
            )}
          </div>
        </PreviewSection>
      ) : (
        <PreviewSection title="Multiple Choice Options">
          <div className="space-y-4">
            {formData.options?.map((option, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  formData.correctOptions.includes(index) 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <p className={`${formData.correctOptions.includes(index) ? 'font-medium text-lg' : 'text-lg'}`}>
                      <span className="mr-3 font-semibold">{String.fromCharCode(65 + index)}.</span>
                      {option.text}
                      {formData.correctOptions.includes(index) && (
                        <span className="ml-2 text-green-600">✓ Correct</span>
                      )}
                    </p>
                  </div>
                  {option.image?.url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={option.image.url} 
                        alt={`Option ${index + 1}`} 
                        className="max-w-[180px] rounded border border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Solution Section */}
      <PreviewSection title="Solution">
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          {formData.solution.text && (
            <div className="prose max-w-none text-lg">
              <p className="text-gray-800">{formData.solution.text}</p>
            </div>
          )}
          {formData.solution.image?.url && (
            <img 
              src={formData.solution.image.url} 
              alt="Solution" 
              className="max-w-[400px] rounded-lg border border-gray-200 mt-3" 
            />
          )}
        </div>
      </PreviewSection>

      {/* Hints Section */}
      {formData.hints.length > 0 && (
        <PreviewSection title={`Hints (${formData.hints.length})`}>
          <div className="space-y-4">
            {formData.hints.map((hint, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200 bg-yellow-50">
                <h4 className="font-medium mb-2 text-lg">Hint {index + 1}</h4>
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <p className="text-gray-800 text-lg">{hint.text}</p>
                  </div>
                  {hint.image?.url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={hint.image.url} 
                        alt={`Hint ${index + 1}`} 
                        className="max-w-[180px] rounded border border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Common Mistakes Section */}
      {formData.commonMistakes && formData.commonMistakes.length > 0 && (
        <PreviewSection title="Common Mistakes">
          <div className="space-y-3 p-4 bg-red-50 rounded-lg">
            <ul className="list-disc pl-6 space-y-3">
              {formData.commonMistakes.map((mistake, index) => (
                <li key={index} className="text-gray-800 mb-3">
                  <div className="font-medium text-lg">{mistake.description}</div>
                  {mistake.explanation && (
                    <div className="text-md text-gray-600 ml-3 mt-1">{mistake.explanation}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </PreviewSection>
      )}

      {/* Tags Section */}
      {(formData.tags.length > 0 || formData.prerequisites.length > 0 || formData.relatedTopics.length > 0) && (
        <PreviewSection title="Tags & Topics">
          {formData.tags.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-md font-medium text-gray-700">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-md">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.prerequisites.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-md font-medium text-gray-700">Prerequisites</h4>
              <div className="flex flex-wrap gap-2">
                {formData.prerequisites.map((prereq, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1 text-md">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.relatedTopics.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-700">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {formData.relatedTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1 text-md">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </PreviewSection>
      )}
    </div>
  );
};

// Helper Components
const PreviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-b border-gray-200 pb-6">
    <h3 className="text-xl font-semibold mb-4 text-gray-900">{title}</h3>
    {children}
  </section>
);

const PreviewField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-600">{label}</dt>
    <dd className="mt-1 text-md text-gray-900">{value}</dd>
  </div>
);

export default QuestionPreview; 