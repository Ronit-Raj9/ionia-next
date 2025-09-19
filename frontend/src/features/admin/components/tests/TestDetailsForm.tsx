"use client";

import { useState, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { TestDetails, testCategories, statuses, solutionsVisibilities, subjects, examTypes, classes, difficulties, platformTestTypes } from "./types";

interface TestDetailsFormProps {
  testDetails: TestDetails;
  onDetailChange: (field: keyof TestDetails, value: any) => void;
  onNestedDetailChange: (parentField: keyof TestDetails, childField: string, value: any) => void;
}

export function TestDetailsForm({
  testDetails,
  onDetailChange,
  onNestedDetailChange
}: TestDetailsFormProps) {
  const [tagInput, setTagInput] = useState("");

  // Memoized handlers for better performance
  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  }, []);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === ',' || e.key === 'Enter') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!testDetails.tags.includes(newTag)) {
        onDetailChange('tags', [...testDetails.tags, newTag]);
      }
      setTagInput(''); // Clear input
    } else if (e.key === 'Backspace' && !tagInput && testDetails.tags.length > 0) {
      e.preventDefault();
      onDetailChange('tags', testDetails.tags.slice(0, -1)); // Remove last tag
    }
  }, [tagInput, testDetails.tags, onDetailChange]);
  
  const removeTag = useCallback((tagToRemove: string) => {
    onDetailChange('tags', testDetails.tags.filter(tag => tag !== tagToRemove));
  }, [testDetails.tags, onDetailChange]);

  // Memoized input handlers for better performance
  const handleInputChange = useCallback((field: keyof TestDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? 
      (e.target.value ? parseInt(e.target.value) : undefined) : 
      e.target.value;
    onDetailChange(field, value);
  }, [onDetailChange]);

  const handleTextareaChange = useCallback((field: keyof TestDetails) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDetailChange(field, e.target.value);
  }, [onDetailChange]);

  const handleSelectChange = useCallback((field: keyof TestDetails) => (value: string) => {
    onDetailChange(field, value === 'placeholder' ? '' : value);
  }, [onDetailChange]);

  const handleSwitchChange = useCallback((field: keyof TestDetails) => (checked: boolean) => {
    onDetailChange(field, checked);
  }, [onDetailChange]);

  const handleNestedInputChange = useCallback((parentField: keyof TestDetails, childField: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onNestedDetailChange(parentField, childField, e.target.value);
  }, [onNestedDetailChange]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Test Details</CardTitle>
        <CardDescription>Provide the core information and configuration for the test. <span className="text-red-500">*</span> Required</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Information Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold text-xl text-gray-800 border-b pb-2 mb-4">Core Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="font-medium">Test Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                value={testDetails.title} 
                onChange={handleInputChange('title')} 
                placeholder="e.g., JEE Main Physics Mock Test 1" 
                required 
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="testCategory" className="font-medium">Test Category <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.testCategory || 'placeholder'} 
                onValueChange={handleSelectChange('testCategory')} 
                required
              >
                <SelectTrigger id="testCategory">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Category</SelectItem>
                  {testCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="font-medium">Description</Label>
            <Textarea 
              id="description" 
              value={testDetails.description} 
              onChange={handleTextareaChange('description')} 
              placeholder="A brief description of the test content or purpose (optional)." 
              className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="font-medium">Tags (Comma or Enter separated)</Label>
            <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-3 min-h-[44px] items-center bg-white">
              {testDetails.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 rounded-full hover:bg-blue-100 p-0.5 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Input 
                id="tags" 
                value={tagInput} 
                onChange={handleTagInputChange} 
                onKeyDown={handleTagKeyDown} 
                placeholder={testDetails.tags.length === 0 ? "Add tags..." : ""}
                className="flex-1 border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 bg-transparent placeholder:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-500">Helps in searching and organizing tests.</p>
          </div>
        </div>

        {/* Classification Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold text-xl text-gray-800 border-b pb-2 mb-4">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="subject" className="font-medium">Subject <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.subject || 'placeholder'} 
                onValueChange={handleSelectChange('subject')} 
                required
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Subject</SelectItem>
                  {subjects.map(sub => <SelectItem key={sub} value={sub}>{sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="examType" className="font-medium">Exam Type <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.examType || 'placeholder'} 
                onValueChange={handleSelectChange('examType')} 
                required
              >
                <SelectTrigger id="examType">
                  <SelectValue placeholder="Select Exam Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Exam Type</SelectItem>
                  {examTypes.map(type => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class" className="font-medium">Class <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.class || 'placeholder'} 
                onValueChange={handleSelectChange('class')} 
                required
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Class</SelectItem>
                  {classes.map(cls => <SelectItem key={cls} value={cls}>{cls.replace('class_', 'Class ').replace('none', 'N/A')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty" className="font-medium">Overall Difficulty</Label>
              <Select 
                value={testDetails.difficulty || 'placeholder'} 
                onValueChange={handleSelectChange('difficulty')}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select Difficulty (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">Select Difficulty (Optional)</SelectItem>
                  {difficulties.map(diff => <SelectItem key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Category Specific Section */}
        {testDetails.testCategory && (
          <div className="space-y-4 p-4 border rounded-lg bg-emerald-50 shadow-sm">
            <h3 className="font-semibold text-xl text-emerald-800 border-b border-emerald-200 pb-2 mb-4">{testDetails.testCategory} Specific Details</h3>
            {testDetails.testCategory === 'PYQ' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="year" className="font-medium">Year <span className="text-red-500">*</span></Label>
                  <Input 
                    id="year" 
                    type="number" 
                    value={testDetails.year ?? ''} 
                    onChange={handleInputChange('year')} 
                    placeholder="YYYY" 
                    required 
                    min="1900" 
                    max={new Date().getFullYear() + 1}
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="month" className="font-medium">Month</Label>
                  <Input 
                    id="month" 
                    type="number" 
                    min="1" 
                    max="12" 
                    value={testDetails.month ?? ''} 
                    onChange={handleInputChange('month')} 
                    placeholder="MM (1-12)" 
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="day" className="font-medium">Day</Label>
                  <Input 
                    id="day" 
                    type="number" 
                    min="1" 
                    max="31" 
                    value={testDetails.day ?? ''} 
                    onChange={handleInputChange('day')} 
                    placeholder="DD (1-31)" 
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="session" className="font-medium">Session</Label>
                  <Input 
                    id="session" 
                    value={testDetails.session ?? ''} 
                    onChange={handleInputChange('session')} 
                    placeholder="e.g., Shift 1, Morning" 
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            {testDetails.testCategory === 'Platform' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="platformTestType" className="font-medium">Platform Test Type <span className="text-red-500">*</span></Label>
                    <Select 
                      value={testDetails.platformTestType || 'placeholder'} 
                      onValueChange={handleSelectChange('platformTestType')} 
                      required
                    >
                      <SelectTrigger id="platformTestType">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled>Select Type</SelectItem>
                        {platformTestTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Switch 
                      id="isPremium" 
                      checked={testDetails.isPremium ?? false} 
                      onCheckedChange={handleSwitchChange('isPremium')} 
                    />
                    <Label htmlFor="isPremium" className="font-medium cursor-pointer">Premium Test</Label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="syllabus" className="font-medium">Syllabus / Topics Covered</Label>
                  <Textarea 
                    id="syllabus" 
                    value={testDetails.syllabus ?? ''} 
                    onChange={handleTextareaChange('syllabus')} 
                    placeholder="Describe the specific topics or chapters covered in this test (optional)." 
                    className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            {testDetails.testCategory === 'UserCustom' && (
              <p className="text-sm text-muted-foreground">User custom tests have minimal specific details during creation. You can define these later if needed.</p>
            )}
          </div>
        )}

        {/* Configuration Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-semibold text-xl text-gray-800 border-b pb-2 mb-4">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="duration" className="font-medium">Duration (minutes) <span className="text-red-500">*</span></Label>
              <Input 
                id="duration" 
                type="number" 
                min="1" 
                value={testDetails.duration} 
                onChange={handleInputChange('duration')} 
                required
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="attemptsAllowed" className="font-medium">Attempts Allowed</Label>
              <Input 
                id="attemptsAllowed" 
                type="number" 
                min="1" 
                value={testDetails.attemptsAllowed ?? ''} 
                onChange={handleInputChange('attemptsAllowed')} 
                placeholder="Unlimited" 
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="status" className="font-medium">Initial Status <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.status} 
                onValueChange={handleSelectChange('status')} 
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Status</SelectItem>
                  {statuses.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="solutionsVisibility" className="font-medium">Solutions Visibility <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.solutionsVisibility} 
                onValueChange={handleSelectChange('solutionsVisibility')} 
                required
              >
                <SelectTrigger id="solutionsVisibility">
                  <SelectValue placeholder="Select When Solutions Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Select Visibility</SelectItem>
                  {solutionsVisibilities.map(vis => <SelectItem key={vis} value={vis}>{vis.replace(/_/g, ' ').replace('after submission', 'After Submission').replace('after deadline', 'After Deadline').replace('manual','Manual').replace('immediate','Immediate')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructions" className="font-medium">Instructions</Label>
            <Textarea 
              id="instructions" 
              value={testDetails.instructions} 
              onChange={handleTextareaChange('instructions')} 
              placeholder="Provide any specific instructions for test takers (optional)." 
              rows={4}
              className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {/* Optional Marking Scheme */}
          <details className="border rounded-lg p-4 bg-gray-50 shadow-inner">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">Optional: Uniform Marking Scheme</summary>
            <p className="text-xs text-gray-500 mt-2 mb-3">Leave blank to use marks defined per question. Fill Correct & Incorrect marks to override.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="markingCorrect">Correct</Label>
                <Input 
                  id="markingCorrect" 
                  type="number" 
                  step="any" 
                  value={testDetails.markingScheme?.correct ?? ''} 
                  onChange={handleNestedInputChange('markingScheme','correct')} 
                  placeholder="e.g., 4" 
                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="markingIncorrect">Incorrect</Label>
                <Input 
                  id="markingIncorrect" 
                  type="number" 
                  max="0" 
                  step="any" 
                  value={testDetails.markingScheme?.incorrect ?? ''} 
                  onChange={handleNestedInputChange('markingScheme','incorrect')} 
                  placeholder="e.g., -1 or 0" 
                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="markingUnattempted">Unattempted</Label>
                <Input 
                  id="markingUnattempted" 
                  type="number" 
                  max="0" 
                  step="any" 
                  value={testDetails.markingScheme?.unattempted ?? ''} 
                  onChange={handleNestedInputChange('markingScheme','unattempted')} 
                  placeholder="Default: 0" 
                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
} 