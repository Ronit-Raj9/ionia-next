import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
        className={`border rounded-md p-2 bg-white flex flex-wrap gap-2 min-h-[42px] cursor-pointer
          ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500' : ''}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value.length > 0 ? (
          value.map((val) => (
            <Badge
              key={val}
              variant="secondary"
              className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              {options.find(opt => opt.value === val)?.label || val}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) {
                    handleRemove(val);
                  }
                }}
                className={`ml-1 rounded-full hover:bg-emerald-100 p-0.5 ${disabled ? 'cursor-not-allowed' : ''}`}
                aria-label={`Remove ${options.find(opt => opt.value === val)?.label || val}`}
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{placeholder}</span>
        )}
        <div className="ml-auto self-center">
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 border border-gray-200 rounded-md bg-white shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Search input */}
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Options list */}
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelection(option);
                  }}
                  className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm"
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchTerm ? "No matching options" : "No options available"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 