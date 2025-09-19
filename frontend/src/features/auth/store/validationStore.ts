// ==========================================
// 🔍 ZUSTAND VALIDATION STORE
// ==========================================

import { create } from 'zustand';
import { 
  validateEmail, 
  validatePasswordStrength, 
  validateUsername, 
  validateFullName,
  validateRegistrationForm,
  validateLoginForm,
  type ValidationResult,
  type PasswordStrength,
  type EmailValidation
} from '../utils/validation';

// Memoization cache for validation results
const validationCache = new Map<string, ValidationResult>();

export interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  isDirty: boolean;
  isTouched: boolean;
}

export interface FieldValidationState extends ValidationState {
  value: string;
  strength?: PasswordStrength;
  emailInfo?: EmailValidation;
}

export interface FormValidationState {
  values: Record<string, any>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  validation: ValidationResult;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
}

interface ValidationStore {
  // Field states
  fields: Record<string, FieldValidationState>;
  
  // Form states
  forms: Record<string, FormValidationState>;
  
  // Actions
  setFieldValue: (fieldId: string, value: string, fieldType: 'email' | 'password' | 'username' | 'fullName') => void;
  setFieldTouched: (fieldId: string) => void;
  setFieldDirty: (fieldId: string) => void;
  resetField: (fieldId: string) => void;
  
  // Form actions
  setFormValues: (formId: string, values: Record<string, any>) => void;
  setFormTouched: (formId: string, field: string) => void;
  setFormDirty: (formId: string, field: string) => void;
  resetForm: (formId: string, initialValues: Record<string, any>) => void;
  
  // Validation actions
  validateField: (fieldId: string, fieldType: 'email' | 'password' | 'username' | 'fullName') => void;
  validateForm: (formId: string, validationType: 'registration' | 'login') => void;
  
  // Getters
  getFieldValidation: (fieldId: string) => FieldValidationState | undefined;
  getFormValidation: (formId: string) => FormValidationState | undefined;
  isFieldValid: (fieldId: string) => boolean;
  isFormValid: (formId: string) => boolean;
}

const validateFieldValue = (value: string, fieldType: 'email' | 'password' | 'username' | 'fullName') => {
  // Check cache first
  const cacheKey = `${fieldType}:${value}`;
  const cached = validationCache.get(cacheKey);
  if (cached) {
    return { result: cached, strength: undefined, emailInfo: undefined };
  }

  let result: ValidationResult;
  let strength: PasswordStrength | undefined;
  let emailInfo: EmailValidation | undefined;

  switch (fieldType) {
    case 'email':
      emailInfo = validateEmail(value);
      result = {
        isValid: emailInfo.isValid,
        errors: emailInfo.isValid ? [] : ['Please enter a valid email address'],
        warnings: emailInfo.suggestions ? [`Did you mean: ${emailInfo.suggestions.join(', ')}?`] : []
      };
      break;
    case 'password':
      strength = validatePasswordStrength(value);
      result = {
        isValid: strength.isValid,
        errors: strength.suggestions,
        warnings: []
      };
      break;
    case 'username':
      result = validateUsername(value);
      break;
    case 'fullName':
      result = validateFullName(value);
      break;
    default:
      result = { isValid: true, errors: [] };
  }

  // Cache the result
  validationCache.set(cacheKey, result);
  
  return { result, strength, emailInfo };
};

export const useValidationStore = create<ValidationStore>((set, get) => ({
  fields: {},
  forms: {},

  setFieldValue: (fieldId, value, fieldType) => {
    set((state) => {
      const currentField = state.fields[fieldId] || {
        value: '',
        isValid: true,
        errors: [],
        warnings: [],
        isDirty: false,
        isTouched: false
      };

      const { result, strength, emailInfo } = validateFieldValue(value, fieldType);

      return {
        fields: {
          ...state.fields,
          [fieldId]: {
            ...currentField,
            value,
            isValid: result.isValid,
            errors: result.errors,
            warnings: result.warnings,
            isDirty: true,
            strength,
            emailInfo
          }
        }
      };
    });
  },

  setFieldTouched: (fieldId) => {
    set((state) => ({
      fields: {
        ...state.fields,
        [fieldId]: {
          ...state.fields[fieldId],
          isTouched: true
        }
      }
    }));
  },

  setFieldDirty: (fieldId) => {
    set((state) => ({
      fields: {
        ...state.fields,
        [fieldId]: {
          ...state.fields[fieldId],
          isDirty: true
        }
      }
    }));
  },

  resetField: (fieldId) => {
    set((state) => {
      const newFields = { ...state.fields };
      delete newFields[fieldId];
      return { fields: newFields };
    });
  },

  setFormValues: (formId, values) => {
    set((state) => {
      const currentForm = state.forms[formId] || {
        values: {},
        touched: {},
        dirty: {},
        validation: { isValid: true, errors: [] },
        isValid: true,
        isDirty: false,
        isTouched: false
      };

      const newDirty = { ...currentForm.dirty };
      Object.keys(values).forEach(key => {
        if (values[key] !== currentForm.values[key]) {
          newDirty[key] = true;
        }
      });

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...currentForm,
            values: { ...currentForm.values, ...values },
            dirty: newDirty,
            isDirty: Object.values(newDirty).some(Boolean)
          }
        }
      };
    });
  },

  setFormTouched: (formId, field) => {
    set((state) => {
      const currentForm = state.forms[formId];
      if (!currentForm) return state;

      const newTouched = { ...currentForm.touched, [field]: true };

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...currentForm,
            touched: newTouched,
            isTouched: Object.values(newTouched).some(Boolean)
          }
        }
      };
    });
  },

  setFormDirty: (formId, field) => {
    set((state) => {
      const currentForm = state.forms[formId];
      if (!currentForm) return state;

      const newDirty = { ...currentForm.dirty, [field]: true };

      return {
        forms: {
          ...state.forms,
          [formId]: {
            ...currentForm,
            dirty: newDirty,
            isDirty: Object.values(newDirty).some(Boolean)
          }
        }
      };
    });
  },

  resetForm: (formId, initialValues) => {
    set((state) => ({
      forms: {
        ...state.forms,
        [formId]: {
          values: initialValues,
          touched: {},
          dirty: {},
          validation: { isValid: true, errors: [] },
          isValid: true,
          isDirty: false,
          isTouched: false
        }
      }
    }));
  },

  validateField: (fieldId, fieldType) => {
    const state = get();
    const field = state.fields[fieldId];
    if (!field) return;

    const { result, strength, emailInfo } = validateFieldValue(field.value, fieldType);

    set((state) => ({
      fields: {
        ...state.fields,
        [fieldId]: {
          ...field,
          isValid: result.isValid,
          errors: result.errors,
          warnings: result.warnings,
          strength,
          emailInfo
        }
      }
    }));
  },

  validateForm: (formId, validationType) => {
    const state = get();
    const form = state.forms[formId];
    if (!form) return;

    let validation: ValidationResult;
    
    if (validationType === 'registration') {
      // Safe type checking for registration form
      const regData = form.values;
      if (typeof regData.fullName === 'string' && 
          typeof regData.email === 'string' && 
          typeof regData.username === 'string' && 
          typeof regData.password === 'string' && 
          typeof regData.confirmPassword === 'string' && 
          typeof regData.acceptTerms === 'boolean') {
        validation = validateRegistrationForm({
          fullName: regData.fullName,
          email: regData.email,
          username: regData.username,
          password: regData.password,
          confirmPassword: regData.confirmPassword,
          acceptTerms: regData.acceptTerms
        });
      } else {
        validation = { isValid: false, errors: ['Invalid form data structure'] };
      }
    } else if (validationType === 'login') {
      // Safe type checking for login form
      const loginData = form.values;
      if (typeof loginData.email === 'string' && typeof loginData.password === 'string') {
        validation = validateLoginForm({
          email: loginData.email,
          password: loginData.password
        });
      } else {
        validation = { isValid: false, errors: ['Invalid form data structure'] };
      }
    } else {
      validation = { isValid: true, errors: [] };
    }

    set((state) => ({
      forms: {
        ...state.forms,
        [formId]: {
          ...form,
          validation,
          isValid: validation.isValid
        }
      }
    }));
  },

  getFieldValidation: (fieldId) => {
    return get().fields[fieldId];
  },

  getFormValidation: (formId) => {
    return get().forms[formId];
  },

  isFieldValid: (fieldId) => {
    const field = get().fields[fieldId];
    return field ? field.isValid : true;
  },

  isFormValid: (formId) => {
    const form = get().forms[formId];
    return form ? form.isValid : true;
  }
}));

// Convenience functions for common use cases
export const useFieldValidation = (fieldId: string, fieldType: 'email' | 'password' | 'username' | 'fullName') => {
  const store = useValidationStore();
  const field = store.getFieldValidation(fieldId);

  return {
    value: field?.value || '',
    validation: field || {
      isValid: true,
      errors: [],
      warnings: [],
      isDirty: false,
      isTouched: false
    },
    setValue: (value: string) => store.setFieldValue(fieldId, value, fieldType),
    setTouched: () => store.setFieldTouched(fieldId),
    setDirty: () => store.setFieldDirty(fieldId),
    reset: () => store.resetField(fieldId),
    isValid: store.isFieldValid(fieldId)
  };
};

export const useFormValidation = (formId: string, validationType: 'registration' | 'login') => {
  const store = useValidationStore();
  const form = store.getFormValidation(formId);

  return {
    values: form?.values || {},
    validation: form?.validation || { isValid: true, errors: [] },
    setValue: (field: string, value: any) => {
      store.setFormValues(formId, { [field]: value });
      store.setFormDirty(formId, field);
    },
    setTouched: (field: string) => store.setFormTouched(formId, field),
    reset: (initialValues: Record<string, any>) => store.resetForm(formId, initialValues),
    isValid: store.isFormValid(formId),
    isDirty: form?.isDirty || false,
    isTouched: form?.isTouched || false
  };
};
