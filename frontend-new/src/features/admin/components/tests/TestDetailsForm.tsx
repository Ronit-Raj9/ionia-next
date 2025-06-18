import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

  // Handle Tag Input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };
  
  const removeTag = (tagToRemove: string) => {
    onDetailChange('tags', testDetails.tags.filter(tag => tag !== tagToRemove));
  };

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
                onChange={(e) => onDetailChange('title', e.target.value)} 
                placeholder="e.g., JEE Main Physics Mock Test 1" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="testCategory" className="font-medium">Test Category <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.testCategory || 'placeholder'} 
                onValueChange={(value) => onDetailChange('testCategory', value)} 
                required
              >
                <SelectTrigger id="testCategory"><SelectValue placeholder="Select Category" /></SelectTrigger>
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
              onChange={(e) => onDetailChange('description', e.target.value)} 
              placeholder="A brief description of the test content or purpose (optional)." 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="font-medium">Tags (Comma or Enter separated)</Label>
            <div className="flex flex-wrap gap-2 border border-input rounded-md p-2 min-h-[40px] items-center bg-background">
              {testDetails.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
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
                className="flex-1 border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">Helps in searching and organizing tests.</p>
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
                onValueChange={(value) => onDetailChange('subject', value)} 
                required
              >
                <SelectTrigger id="subject"><SelectValue placeholder="Select Subject" /></SelectTrigger>
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
                onValueChange={(value) => onDetailChange('examType', value)} 
                required
              >
                <SelectTrigger id="examType"><SelectValue placeholder="Select Exam Type" /></SelectTrigger>
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
                onValueChange={(value) => onDetailChange('class', value)} 
                required
              >
                <SelectTrigger id="class"><SelectValue placeholder="Select Class" /></SelectTrigger>
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
                onValueChange={(value) => onDetailChange('difficulty', value)}
              >
                <SelectTrigger id="difficulty"><SelectValue placeholder="Select Difficulty (Optional)" /></SelectTrigger>
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
                    onChange={(e) => onDetailChange('year', e.target.value ? parseInt(e.target.value) : undefined)} 
                    placeholder="YYYY" 
                    required 
                    min="1900" 
                    max={new Date().getFullYear() + 1}
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
                    onChange={(e) => onDetailChange('month', e.target.value ? parseInt(e.target.value) : undefined)} 
                    placeholder="MM (1-12)" 
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
                    onChange={(e) => onDetailChange('day', e.target.value ? parseInt(e.target.value) : undefined)} 
                    placeholder="DD (1-31)" 
                  />
                </div>
                <div>
                  <Label htmlFor="session" className="font-medium">Session</Label>
                  <Input 
                    id="session" 
                    value={testDetails.session ?? ''} 
                    onChange={(e) => onDetailChange('session', e.target.value)} 
                    placeholder="e.g., Shift 1, Morning" 
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
                      onValueChange={(value) => onDetailChange('platformTestType', value)} 
                      required
                    >
                      <SelectTrigger id="platformTestType"><SelectValue placeholder="Select Type" /></SelectTrigger>
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
                      onCheckedChange={(checked: boolean) => onDetailChange('isPremium', checked)} 
                    />
                    <Label htmlFor="isPremium" className="font-medium cursor-pointer">Premium Test</Label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="syllabus" className="font-medium">Syllabus / Topics Covered</Label>
                  <Textarea 
                    id="syllabus" 
                    value={testDetails.syllabus ?? ''} 
                    onChange={(e) => onDetailChange('syllabus', e.target.value)} 
                    placeholder="Describe the specific topics or chapters covered in this test (optional)." 
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
                onChange={(e) => onDetailChange('duration', e.target.value ? parseInt(e.target.value) : 0)} 
                required
              />
            </div>
            <div>
              <Label htmlFor="attemptsAllowed" className="font-medium">Attempts Allowed</Label>
              <Input 
                id="attemptsAllowed" 
                type="number" 
                min="1" 
                value={testDetails.attemptsAllowed ?? ''} 
                onChange={(e) => onDetailChange('attemptsAllowed', e.target.value ? parseInt(e.target.value) : null)} 
                placeholder="Unlimited" 
              />
            </div>
            <div>
              <Label htmlFor="status" className="font-medium">Initial Status <span className="text-red-500">*</span></Label>
              <Select 
                value={testDetails.status} 
                onValueChange={(value) => onDetailChange('status', value)} 
                required
              >
                <SelectTrigger id="status"><SelectValue placeholder="Select Status" /></SelectTrigger>
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
                onValueChange={(value) => onDetailChange('solutionsVisibility', value)} 
                required
              >
                <SelectTrigger id="solutionsVisibility"><SelectValue placeholder="Select When Solutions Show" /></SelectTrigger>
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
              onChange={(e) => onDetailChange('instructions', e.target.value)} 
              placeholder="Provide any specific instructions for test takers (optional)." 
              rows={4}
            />
          </div>
          {/* Optional Marking Scheme */}
          <details className="border rounded-lg p-4 bg-gray-50 shadow-inner">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">Optional: Uniform Marking Scheme</summary>
            <p className="text-xs text-muted-foreground mt-2 mb-3">Leave blank to use marks defined per question. Fill Correct & Incorrect marks to override.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="markingCorrect">Correct</Label>
                <Input 
                  id="markingCorrect" 
                  type="number" 
                  step="any" 
                  value={testDetails.markingScheme?.correct ?? ''} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedDetailChange('markingScheme','correct', e.target.value)} 
                  placeholder="e.g., 4" 
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedDetailChange('markingScheme','incorrect', e.target.value)} 
                  placeholder="e.g., -1 or 0" 
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNestedDetailChange('markingScheme','unattempted', e.target.value)} 
                  placeholder="Default: 0" 
                />
              </div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
} 