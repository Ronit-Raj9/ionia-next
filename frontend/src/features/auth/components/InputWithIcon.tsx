"use client";

import React from 'react';

interface InputWithIconProps {
  id: string;
  name?: string;
  type?: 'text' | 'email' | 'password';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string | null;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function InputWithIcon({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  disabled = false,
  required = false,
  className = '',
  ...props
}: InputWithIconProps) {
  const inputClasses = `
    w-full h-12 px-4 py-3 rounded-lg border transition-shadow duration-150 outline-none text-base placeholder:text-gray-500
    ${error 
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100' 
      : 'border-gray-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
    }
    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'}
    ${className}
  `.trim();

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
