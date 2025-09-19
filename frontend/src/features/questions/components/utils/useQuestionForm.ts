import { useState, useEffect } from 'react';
import { QuestionFormData, ValidationErrors } from './types';

const defaultFormData: QuestionFormData = {
  question: {
    text: "",
    image: { url: "", publicId: "", file: null }
  },
  options: [
    { text: "", image: { url: "", publicId: "", file: null } },
    { text: "", image: { url: "", publicId: "", file: null } },
    { text: "", image: { url: "", publicId: "", file: null } }, 
    { text: "", image: { url: "", publicId: "", file: null } }
  ],
  correctOptions: [],
  questionType: "single",
  questionCategory: "theoretical",
  questionSource: "custom",
  examType: "jee_main",
  class: "class_12",
  subject: "",
  chapter: "",
  section: "",
  difficulty: "medium",
  year: "not applicable",
  languageLevel: "intermediate",
  language: "english",
  solution: {
    text: "",
    image: { url: "", publicId: "", file: null }
  },
  hints: [],
  tags: [],
  relatedTopics: [],
  prerequisites: [],
  marks: 1,
  negativeMarks: 0,
  expectedTime: 120,
  commonMistakes: [],
  conceptualDifficulty: 5,
  isVerified: false,
  numericalAnswer: {
    exactValue: 0,
    range: {
      min: 0,
      max: 0
    },
    unit: ""
  },
  feedback: {
    studentReports: [],
    teacherNotes: []
  },
  isActive: true
};

export const useQuestionForm = () => {
  const [formData, setFormData] = useState<QuestionFormData>(defaultFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('questionDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Ensure the structure matches our current state
        setFormData(prevData => ({
          ...prevData,
          ...parsedDraft,
          // Ensure proper structure for question image
          question: {
            text: parsedDraft.question?.text || '',
            image: parsedDraft.question?.image || { url: '', publicId: '', file: null }
          },
          // Ensure proper structure for solution image
          solution: {
            text: parsedDraft.solution?.text || '',
            image: parsedDraft.solution?.image || { url: '', publicId: '', file: null }
          },
          // Fix options structure
          options: parsedDraft.options?.map((opt: any) => ({
            text: opt.text || '',
            image: opt.image || { url: '', publicId: '', file: null }
          })) || prevData.options,
          // Fix hints structure
          hints: parsedDraft.hints?.map((hint: any) => ({
            text: hint.text || '',
            image: hint.image || { url: '', publicId: '', file: null }
          })) || prevData.hints
        }));
      } catch (e) {
        console.error("Error parsing draft data:", e);
      }
    }
  }, []);

  // Autosave functionality
  useEffect(() => {
    const autosaveData = () => {
      // Create a deep copy to avoid mutation
      const dataToSave = JSON.parse(JSON.stringify(formData));
      
      // Reset image URLs to empty to avoid bloating localStorage
      if (dataToSave.question && dataToSave.question.image) {
        dataToSave.question.image = { url: '', publicId: '', file: null };
      }
      
      if (dataToSave.solution && dataToSave.solution.image) {
        dataToSave.solution.image = { url: '', publicId: '', file: null };
      }
      
      if (dataToSave.options) {
        dataToSave.options = dataToSave.options.map((opt: any) => ({
          ...opt,
          image: { url: '', publicId: '', file: null }
        }));
      }
      
      if (dataToSave.hints) {
        dataToSave.hints = dataToSave.hints.map((hint: any) => ({
          ...hint,
          image: { url: '', publicId: '', file: null }
        }));
      }
      
      localStorage.setItem('questionDraft', JSON.stringify(dataToSave));
    };

    const timeoutId = setTimeout(autosaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 
    field?: string,
    nestedField?: string,
    index?: number
  ) => {
    // Clear error for this field
    if (field) setErrors(prev => ({ ...prev, [field]: '' }));
    
    const { name, value } = e.target;
    const fieldName = field || name;
    
    setFormData(prev => {
      // Create a deep copy to avoid mutation
      const newState = { ...prev };
      
      if (index !== undefined && nestedField) {
        // Handle nested array fields like options[0].text
        if (fieldName === 'options') {
          const newOptions = [...prev.options];
          newOptions[index] = { ...newOptions[index], [nestedField]: value };
          newState.options = newOptions;
        } else if (fieldName === 'hints') {
          const newHints = [...prev.hints];
          newHints[index] = { ...newHints[index], [nestedField]: value };
          newState.hints = newHints;
        } else if (fieldName === 'commonMistakes') {
          const newMistakes = [...prev.commonMistakes];
          newMistakes[index] = { ...newMistakes[index], [nestedField]: value };
          newState.commonMistakes = newMistakes;
        }
      } else if (nestedField && fieldName === 'question') {
        // Handle question.text
        newState.question = {
          ...prev.question,
          [nestedField]: value
        };
      } else if (nestedField && fieldName === 'solution') {
        // Handle solution.text
        newState.solution = {
          ...prev.solution,
          [nestedField]: value
        };
      } else if (nestedField && fieldName === 'numericalAnswer') {
        // Handle nested object like numericalAnswer.exactValue
        const numericalAnswer = { ...prev.numericalAnswer! };
        
        if (nestedField === 'range') {
          // Handle range object
          numericalAnswer.range = { 
            ...numericalAnswer.range,
            ...(typeof value === 'object' ? value : {})
          };
        } else if (nestedField === 'exactValue') {
          // Handle exact value (number)
          numericalAnswer.exactValue = parseFloat(value as string);
        } else {
          // Handle other properties
          (numericalAnswer as any)[nestedField] = value;
        }
        
        newState.numericalAnswer = numericalAnswer;
      } else if (nestedField && fieldName === 'numericalAnswer.range') {
        // Handle doubly nested like numericalAnswer.range.min
        const numericalAnswer = { ...prev.numericalAnswer! };
        numericalAnswer.range = {
          ...numericalAnswer.range,
          [nestedField]: parseFloat(value as string)
        };
        newState.numericalAnswer = numericalAnswer;
      } else {
        // Handle simple fields
        (newState as any)[fieldName] = value;
      }
      
      return newState;
    });
    
    setIsSaved(false);
  };

  // Handle file upload
  const handleFileUpload = (file: File | null, field: string, index?: number) => {
    setFormData(prev => {
      if (field === 'questionImage') {
        // Store both URL for preview and the actual file object
        const url = file ? URL.createObjectURL(file) : '';
        return { 
          ...prev, 
          question: {
            ...prev.question,
            image: { 
              url, // URL for preview only
              publicId: '',
              file // Store the actual file for upload (File | null)
            }
          }
        };
      } else if (field === 'solutionImage') {
        const url = file ? URL.createObjectURL(file) : '';
        return { 
          ...prev, 
          solution: {
            ...prev.solution,
            image: { 
              url, // URL for preview only
              publicId: '',
              file // Store the actual file for upload (File | null)
            }
          }
        };
      } else if (field === 'optionImage' && index !== undefined) {
        const newOptions = [...prev.options];
        const url = file ? URL.createObjectURL(file) : '';
        
        newOptions[index] = { 
          ...newOptions[index],
          image: {
            url, // URL for preview only
            publicId: '',
            file // Store the actual file for upload (File | null)
          }
        };
        
        return { ...prev, options: newOptions };
      } else if (field === 'hintImage' && index !== undefined) {
        const newHints = [...prev.hints];
        const url = file ? URL.createObjectURL(file) : '';
        
        newHints[index] = { 
          ...newHints[index],
          image: {
            url, // URL for preview only
            publicId: '',
            file // Store the actual file for upload (File | null)
          }
        };
        
        return { ...prev, hints: newHints };
      }
      
      return prev;
    });
    
    setIsSaved(false);
  };
  
  // Handle correct option selection
  const handleCorrectOptionChange = (index: number) => {
    setFormData(prev => {
      // For single choice, replace the array with just this index
      if (prev.questionType === 'single') {
        return { ...prev, correctOptions: [index] };
      }
      
      // For multiple choice, toggle the index
      const newCorrectOptions = [...prev.correctOptions];
      const existingIndex = newCorrectOptions.indexOf(index);
      
      if (existingIndex >= 0) {
        newCorrectOptions.splice(existingIndex, 1);
      } else {
        newCorrectOptions.push(index);
      }
      
      return { ...prev, correctOptions: newCorrectOptions };
    });
    
    setIsSaved(false);
    
    // Clear error for correctOptions
    setErrors(prev => ({ ...prev, correctOptions: '' }));
  };
  
  // Handle arrays like tags, prerequisites, etc.
  const handleArrayField = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    setIsSaved(false);
  };

  // Function to handle tag input with comma or Enter key
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      
      if (value && !formData[field].includes(value)) {
        setFormData({
          ...formData,
          [field]: [...formData[field], value]
        });
        input.value = '';
      }
    }
  };
  
  // Function to remove a tag from an array field
  const removeTag = (index: number, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };
  
  // Add/remove options
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', image: { url: '', publicId: '', file: null } }]
    }));
    
    setIsSaved(false);
  };
  
  const removeOption = (index: number) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions.splice(index, 1);
      
      // Also remove this index from correctOptions if it's there
      const newCorrectOptions = prev.correctOptions
        .filter(optIndex => optIndex !== index)
        .map(optIndex => optIndex > index ? optIndex - 1 : optIndex); // Adjust indices
      
      return {
        ...prev,
        options: newOptions,
        correctOptions: newCorrectOptions
      };
    });
    
    setIsSaved(false);
  };
  
  // Add/remove hints
  const addHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, { text: '', image: { url: '', publicId: '', file: null } }]
    }));
    
    setIsSaved(false);
  };
  
  const removeHint = (index: number) => {
    setFormData(prev => {
      const newHints = [...prev.hints];
      newHints.splice(index, 1);
      return { ...prev, hints: newHints };
    });
    
    setIsSaved(false);
  };
  
  // Add/remove common mistakes
  const addCommonMistake = () => {
    setFormData(prev => ({
      ...prev,
      commonMistakes: [...prev.commonMistakes, { description: '', explanation: '' }]
    }));
    
    setIsSaved(false);
  };
  
  const removeCommonMistake = (index: number) => {
    setFormData(prev => {
      const newMistakes = [...prev.commonMistakes];
      newMistakes.splice(index, 1);
      return { ...prev, commonMistakes: newMistakes };
    });
    
    setIsSaved(false);
  };

  // Save manually
  const saveFormData = () => {
    // Create a deep copy to avoid mutation
    const dataToSave = JSON.parse(JSON.stringify(formData));
    
    // Reset image URLs to empty to avoid bloating localStorage
    if (dataToSave.question && dataToSave.question.image) {
      dataToSave.question.image = { url: '', publicId: '', file: null };
    }
    
    if (dataToSave.solution && dataToSave.solution.image) {
      dataToSave.solution.image = { url: '', publicId: '', file: null };
    }
    
    if (dataToSave.options) {
      dataToSave.options = dataToSave.options.map((opt: any) => ({
        ...opt,
        image: { url: '', publicId: '', file: null }
      }));
    }
    
    if (dataToSave.hints) {
      dataToSave.hints = dataToSave.hints.map((hint: any) => ({
        ...hint,
        image: { url: '', publicId: '', file: null }
      }));
    }
    
    localStorage.setItem('questionDraft', JSON.stringify(dataToSave));
    setIsSaved(true);
    
    // Hide the saved message after 3 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  // Clear form data
  const clearFormData = () => {
    if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
      localStorage.removeItem('questionDraft');
      setFormData(defaultFormData);
      setErrors({});
      setIsSaved(false);
      console.log("Form data has been reset");
    }
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSaved,
    setIsSaved,
    loading,
    setLoading,
    handleInputChange,
    handleFileUpload,
    handleCorrectOptionChange,
    handleArrayField,
    handleTagInput,
    removeTag,
    addOption,
    removeOption,
    addHint,
    removeHint,
    addCommonMistake,
    removeCommonMistake,
    saveFormData,
    clearFormData,
  };
}; 