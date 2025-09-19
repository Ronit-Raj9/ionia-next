"use client";

import React, { useState } from 'react';
import { InputWithIcon } from './InputWithIcon';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed } from 'react-icons/hi';

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
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const rightIcon = (
    <button
      type="button"
      onClick={togglePasswordVisibility}
      className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      aria-pressed={showPassword}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={0}
      disabled={disabled}
    >
      {showPassword ? (
        <HiOutlineEyeOff className="w-5 h-5 text-gray-400" aria-hidden="true" />
      ) : (
        <HiOutlineEye className="w-5 h-5 text-gray-400" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <InputWithIcon
      id={id}
      name={name}
      type={showPassword ? 'text' : 'password'}
      label={label}
      placeholder={placeholder}
      icon={<HiOutlineLockClosed />}
      rightIcon={rightIcon}
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
