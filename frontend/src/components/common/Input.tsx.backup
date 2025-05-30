// frontend/components/common/Input.tsx
"use client";
import { FC } from "react";

interface InputProps {
  label: string;
  type?: string;
  value: string;
  placeholder?: string; // ✅ Added placeholder support
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input: FC<InputProps> = ({ label, type = "text", value, placeholder, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder} // ✅ Now correctly supports placeholder
        className="mt-1 p-2 w-full border rounded-md"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
