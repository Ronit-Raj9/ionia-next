import React from 'react';
import { QuestionFormData } from '../../utils/types';
import { Badge } from '@/components/ui/badge';

interface QuestionPreviewProps {
  formData: QuestionFormData;
}


const QuestionPreview: React.FC<QuestionPreviewProps> = ({ formData }) => {
  // Option 1: Log before the return statement
  console.log("Question test:", formData.question.text);
  
  // Option 2: Use useEffect for logging after render
  React.useEffect(() => {
    console.log("Question data after render:", formData.question);
  }, [formData.question]);

  return (
    <div className="space-y-6">
      {/* Question Content Section */}
      <PreviewSection title="Question Content">
        <div className="space-y-2">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {formData.question.text && (
                <div className="prose max-w-none">
                  <p className="text-gray-800">{formData.question.text}</p>
                </div>
              )}
            </div>
            {formData.question.image?.url && (
              <div className="flex-shrink-0">
                <img 
                  src={formData.question.image.url} 
                  alt="Question" 
                  className="max-w-[200px] rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-sm">
            {formData.questionType === 'numerical' ? 'Numerical' : 
             formData.questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
          </Badge>
        </div>
      </PreviewSection>

      {/* Classification Section */}
      <PreviewSection title="Classification">
        <div className="grid grid-cols-2 gap-4">
          <PreviewField label="Exam Type" value={formData.examType} />
          <PreviewField label="Class" value={formData.class} />
          <PreviewField label="Subject" value={formData.subject} />
          <PreviewField label="Section" value={formData.section} />
          <PreviewField label="Chapter" value={formData.chapter} />
          <PreviewField label="Difficulty" value={formData.difficulty} />
          <PreviewField label="Marks" value={formData.marks.toString()} />
          <PreviewField label="Negative Marks" value={formData.negativeMarks.toString()} />
        </div>
      </PreviewSection>

      {/* Answer Section */}
      {formData.questionType === 'numerical' ? (
        <PreviewSection title="Numerical Answer">
          <div className="space-y-2">
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
          <div className="space-y-2">
            {formData.options?.map((option, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  formData.correctOptions.includes(index) 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className={`${formData.correctOptions.includes(index) ? 'font-medium' : ''}`}>
                      {option.text}
                    </p>
                  </div>
                  {option.image?.url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={option.image.url} 
                        alt={`Option ${index + 1}`} 
                        className="max-w-[100px] rounded border border-gray-200" 
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
        <div className="space-y-2">
          {formData.solution.text && (
            <div className="prose max-w-none">
              <p className="text-gray-800">{formData.solution.text}</p>
            </div>
          )}
          {formData.solution.image?.url && (
            <img 
              src={formData.solution.image.url} 
              alt="Solution" 
              className="max-w-[300px] rounded-lg border border-gray-200" 
            />
          )}
        </div>
      </PreviewSection>

      {/* Hints Section */}
      {formData.hints.length > 0 && (
        <PreviewSection title={`Hints (${formData.hints.length})`}>
          <div className="space-y-3">
            {formData.hints.map((hint, index) => (
              <div key={index} className="p-3 rounded-lg border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-gray-800">{hint.text}</p>
                  </div>
                  {hint.image?.url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={hint.image.url} 
                        alt={`Hint ${index + 1}`} 
                        className="max-w-[100px] rounded border border-gray-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Tags Section */}
      {(formData.tags.length > 0 || formData.prerequisites.length > 0 || formData.relatedTopics.length > 0) && (
        <PreviewSection title="Tags & Topics">
          {formData.tags.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-600">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.prerequisites.length > 0 && (
            <div className="space-y-1 mt-3">
              <h4 className="text-sm font-medium text-gray-600">Prerequisites</h4>
              <div className="flex flex-wrap gap-1">
                {formData.prerequisites.map((prereq, index) => (
                  <Badge key={index} variant="outline">
                    {prereq}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.relatedTopics.length > 0 && (
            <div className="space-y-1 mt-3">
              <h4 className="text-sm font-medium text-gray-600">Related Topics</h4>
              <div className="flex flex-wrap gap-1">
                {formData.relatedTopics.map((topic, index) => (
                  <Badge key={index} variant="outline">
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
  <section className="border-b border-gray-200 pb-4">
    <h3 className="text-lg font-semibold mb-3 text-gray-900">{title}</h3>
    {children}
  </section>
);

const PreviewField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-600">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value}</dd>
  </div>
);

export default QuestionPreview; 