"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option.value)
  );

  const handleSelection = (option: MultiSelectOption) => {
    onChange([...value, option.value]);
    setSearchTerm("");
  };

  const handleRemove = (val: string) => {
    onChange(value.filter(v => v !== val));
  };

  return (
    <div className="relative mb-4" ref={containerRef}>
      <Label className={`block text-sm font-medium mb-1 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
      </Label>
      
      {/* Selected items */}
      <div 
        className={`border rounded-lg p-3 bg-white flex flex-wrap gap-2 min-h-[44px] cursor-pointer transition-all duration-200
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' : 'border-gray-300 hover:border-gray-400 hover:shadow-md'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed border-gray-200' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value.length > 0 ? (
          value.map((val) => (
            <Badge
              key={val}
              variant="secondary"
              className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-medium transition-all duration-150 hover:bg-blue-100"
            >
              {options.find(opt => opt.value === val)?.label || val}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    handleRemove(val);
                  }
                }}
                className={`ml-1 rounded-full hover:bg-blue-200 p-0.5 transition-colors duration-150 ${disabled ? 'cursor-not-allowed' : ''}`}
                aria-label={`Remove ${options.find(opt => opt.value === val)?.label || val}`}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{placeholder}</span>
        )}
        <div className="ml-auto self-center">
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-2 border border-gray-200 rounded-xl bg-white shadow-2xl backdrop-blur-sm z-50 max-h-64 overflow-y-auto">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Options list */}
          <ul className="py-2 bg-white rounded-b-xl">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelection(option);
                  }}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-700 transition-all duration-150 hover:text-blue-900 mx-2 rounded-lg"
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-sm text-gray-500 text-center bg-white">
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-5 w-5 text-gray-300" />
                  <span>{searchTerm ? "No matching options" : "No options available"}</span>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 