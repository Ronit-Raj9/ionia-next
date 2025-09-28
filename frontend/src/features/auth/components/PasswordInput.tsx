"use client";

import React from 'react';
import { InputWithIcon } from './InputWithIcon';

interface PasswordInputProps {
  id: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string | null;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  showStrengthIndicator?: boolean;
}

export function PasswordInput({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  autoComplete = 'new-password',
  disabled = false,
  required = false,
  showStrengthIndicator = false,
  ...props
}: PasswordInputProps) {
  return (
    <InputWithIcon
      id={id}
      name={name}
      type="password"
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      autoComplete={autoComplete}
      disabled={disabled}
      required={required}
      {...props}
    />
  );
}
