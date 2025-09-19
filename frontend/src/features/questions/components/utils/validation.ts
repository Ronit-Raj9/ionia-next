import { QuestionFormData, ValidationErrors } from './types';

// Validate form based on current step
export const validateForm = (formData: QuestionFormData, currentStep: number): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (currentStep === 1) {
    // Question text/image is required
    if (!formData.question.text.trim() && (!formData.question.image || !formData.question.image.url)) {
      errors.question = "Either question text or image is required";
    }
    
    // For multiple choice questions
    if (formData.questionType !== 'numerical') {
      // Check if we have at least 2 options
      if (formData.options.length < 2) {
        errors.options = "At least 2 options are required";
      } else {
        // Check if all options have content
        const emptyOptions = formData.options.some(
          (option) => !option.text.trim() && (!option.image || !option.image.url)
        );
        if (emptyOptions) {
          errors.options = "All options must have either text or image content";
        }
      }
      
      // Check if at least one correct option is selected
      if (formData.correctOptions.length === 0) {
        errors.correctOptions = "At least one correct option must be selected";
      }
      
      // For multiple choice, allow multiple correct options
      // For single choice, only one correct option is allowed
      if (formData.questionType === 'single' && formData.correctOptions.length > 1) {
        errors.correctOptions = "Only one correct option is allowed for single choice questions";
      }
    } else {
      // Numerical question validation
      if (formData.numericalAnswer?.exactValue === undefined) {
        errors['numericalAnswer.exactValue'] = "Exact value is required";
      }
      
      if (formData.numericalAnswer?.range.min === undefined || 
          formData.numericalAnswer?.range.max === undefined) {
        errors['numericalAnswer.range'] = "Both minimum and maximum range are required";
      } else if (formData.numericalAnswer?.range.min >= formData.numericalAnswer?.range.max) {
        errors['numericalAnswer.range'] = "Maximum range must be greater than minimum range";
      }
      
      // Check if exact value is within range
      const { exactValue, range } = formData.numericalAnswer || { exactValue: 0, range: { min: 0, max: 0 } };
      if (exactValue !== undefined && range.min !== undefined && range.max !== undefined) {
        if (exactValue < range.min || exactValue > range.max) {
          errors['numericalAnswer.exactValue'] = "Exact value must be within the specified range";
        }
      }
    }
    
    // Add validation for questionCategory and questionSource
    if (!formData.questionCategory) {
      errors.questionCategory = "Question category is required";
    }
    if (!formData.questionSource) {
      errors.questionSource = "Question source is required";
    }
    
    // For PYQ questions, year is required
    if (formData.questionSource === 'pyq' && formData.year === 'not applicable') {
      errors.year = "Year is required for previous year questions";
    }
  } else if (currentStep === 2) {
    // Subject and classification validation
    if (!formData.examType) {
      errors.examType = "Exam type is required";
    }
    
    if (!formData.class) {
      errors.class = "Class is required";
    }
    
    if (!formData.subject) {
      errors.subject = "Subject is required";
    }
    
    if (!formData.chapter.trim()) {
      errors.chapter = "Chapter is required";
    }
    
    // Section validation based on subject
    if (['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(formData.subject.toLowerCase())) {
      if (!formData.section) {
        errors.section = `Section is required for ${formData.subject}`;
      }
    }
    
    if (!formData.difficulty) {
      errors.difficulty = "Difficulty is required";
    }
    
    if (!formData.language) {
      errors.language = "Language is required";
    }
    
    if (!formData.languageLevel) {
      errors.languageLevel = "Language level is required";
    }
    
    if (formData.marks <= 0) {
      errors.marks = "Marks must be greater than 0";
    }
    
    // Validate that negative marks are not positive
    if (formData.negativeMarks > 0) {
      errors.negativeMarks = "Negative marks cannot be positive";
    }
  } else if (currentStep === 3) {
    // Solution validation
    if (!formData.solution.text.trim() && (!formData.solution.image || !formData.solution.image.url)) {
      errors.solution = "Either solution text or image is required";
    }
    
    // Hints are optional, but if added, they must have content
    formData.hints.forEach((hint, index) => {
      if (!hint.text.trim() && (!hint.image || !hint.image.url)) {
        errors[`hints[${index}]`] = "Hint must have either text or image content";
      }
    });
    
    // Common mistakes are optional, but if added, they must have content
    formData.commonMistakes.forEach((mistake, index) => {
      if (!mistake.description.trim()) {
        errors[`commonMistakes[${index}].description`] = "Description is required";
      }
      if (!mistake.explanation.trim()) {
        errors[`commonMistakes[${index}].explanation`] = "Explanation is required";
      }
    });
  }
  
  return errors;
};

// Validate all steps before submission
export const validateAllSteps = (formData: QuestionFormData): ValidationErrors | null => {
  // Check all 4 steps
  for (let i = 1; i <= 4; i++) {
    const validationErrors = validateForm(formData, i);
    if (Object.keys(validationErrors).length > 0) {
      return validationErrors;
    }
  }
  
  return null;
}; 