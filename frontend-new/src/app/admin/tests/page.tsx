"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, X, Edit, Trash2, Eye, ChevronLeft, ChevronRight, CheckCircle2, Tag, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Assume shadcn/ui components are imported or use placeholders
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // For actions
import { Skeleton } from "@/components/ui/skeleton";

// Define the Test interface based on backend model (simplified)
interface Test {
  _id: string;
  title: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  platformTestType?: string; // Only for Platform tests
  subject: string;
  examType: string;
  class: string;
  status: 'draft' | 'published' | 'archived';
  questionCount: number;
  totalMarks: number;
  year?: number; // For PYQ
  createdAt: string;
  // Add other relevant fields as needed for display
}

interface ApiResponse {
  docs: Test[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);
  const [limit] = useState(10); // Items per page

  // Filtering and Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    testCategory: '',
    status: '',
    subject: '',
    examType: '',
    // Add more filters as needed
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for status updates
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Add this near your other state variables
  const [isFetchingAll, setIsFetchingAll] = useState(false);

  // Fetch tests function
  const fetchTests = useCallback(async (fetchAllTests = false) => {
    setLoading(true);
    setError(null);
    
    // Return a Promise so we can chain .finally()
    return new Promise<void>(async (resolve, reject) => {
      try {
        let endpoint = `${API_BASE_URL}/tests`;
        
        // If we need to fetch all tests, use the dedicated endpoint
        if (fetchAllTests) {
          endpoint = `${API_BASE_URL}/tests/all`;
        }
        
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder,
        });

        // Add fetchAll parameter if needed
        if (fetchAllTests) {
          queryParams.append('fetchAll', 'true');
        }

        // Add filters to query params if they exist
        if (filters.testCategory) queryParams.append('testCategory', filters.testCategory);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.subject) queryParams.append('subject', filters.subject);
        if (filters.examType) queryParams.append('examType', filters.examType);
        // Add searchTerm if needed (backend must support it)
        // if (searchTerm) queryParams.append('search', searchTerm); 

        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`${endpoint}?${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tests: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        
        if (data.success && data.data) {
          const result = data.data as ApiResponse;
          setTests(result.docs || []);
          setTotalTests(result.totalDocs || 0);
          setTotalPages(result.totalPages || 1);
          setCurrentPage(result.page || 1);
          
          // Log success message
          console.log(`Successfully fetched ${result.docs?.length} out of ${result.totalDocs} tests`);
          resolve(); // Resolve the promise on success
        } else {
          throw new Error(data.message || 'Failed to parse test data');
        }
      } catch (err: any) {
        console.error("Fetch Tests Error:", err);
        setError(err.message || 'Could not load tests.');
        setTests([]); // Clear tests on error
        setTotalTests(0);
        setTotalPages(1);
        reject(err); // Reject the promise on error
      } finally {
        setLoading(false);
      }
    });
  }, [currentPage, limit, sortBy, sortOrder, filters, searchTerm]); // Dependencies

  // Fetch tests on initial load and when dependencies change
  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Handle filter changes
  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value === 'all' ? '' : value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ testCategory: '', status: '', subject: '', examType: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Handle deletion
  const openDeleteDialog = (test: Test) => {
    setTestToDelete(test);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;
    setIsDeleting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/tests/${testToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Catch JSON parsing errors
        throw new Error(errorData.message || `Failed to delete test: ${response.statusText}`);
      }
      
      toast.success(`Test "${testToDelete.title}" deleted successfully.`);
      setShowDeleteDialog(false);
      setTestToDelete(null);
      // Refresh the list after deletion
      fetchTests(); 

    } catch (err: any) {
      console.error("Delete Test Error:", err);
      toast.error(err.message || 'Could not delete test.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Memoize active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);
  }, [filters, searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const getStatusBadgeVariant = (status: Test['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published': return 'default'; // Greenish
      case 'draft': return 'secondary'; // Greyish
      case 'archived': return 'outline'; // Outline
      default: return 'secondary';
    }
  };

  // New function to handle status updates
  const handleStatusChange = async (testId: string, newStatus: Test['status']) => {
    // Prevent multiple updates at once
    if (updatingStatusId) return;
    
    setUpdatingStatusId(testId);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in.");
      }
      
      console.log(`Updating test ${testId} status to ${newStatus}`);
      
      // Make the API request
      const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          changesDescription: `Status changed to ${newStatus}`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error updating status: ${response.status}`, errorData);
        throw new Error(`Failed to update status (${response.status})`);
      }
      
      // Update the local state to reflect the change
      setTests(tests.map(test => 
        test._id === testId ? { ...test, status: newStatus } : test
      ));
      
      toast.success(`Status updated to ${newStatus}`);
      
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Update the handleFetchAllTests function
  const handleFetchAllTests = () => {
    // When fetching all tests, we reset pagination to simplify things
    setCurrentPage(1);
    setIsFetchingAll(true);
    
    // Call fetchTests with fetchAll=true
    fetchTests(true)
      .finally(() => {
        setIsFetchingAll(false);
      });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Tests</h1>
        <Link href="/admin/tests/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Test
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFilterCount} Active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input - Implement backend search if needed */}
            {/* <Input 
              placeholder="Search by title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            /> */}
            <Select value={filters.testCategory} onValueChange={(value: string) => handleFilterChange('testCategory', value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="PYQ">PYQ</SelectItem>
                <SelectItem value="Platform">Platform</SelectItem>
                <SelectItem value="UserCustom">User Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {/* Add more Select filters for subject, examType etc. */}
             <Select value={filters.subject} onValueChange={(value: string) => handleFilterChange('subject', value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">All Subjects</SelectItem>
                 {/* Populate with actual subjects */}
                 <SelectItem value="physics">Physics</SelectItem> 
                 <SelectItem value="chemistry">Chemistry</SelectItem> 
                 <SelectItem value="mathematics">Mathematics</SelectItem> 
                 <SelectItem value="Mixed">Mixed</SelectItem> 
                 <SelectItem value="Full Syllabus">Full Syllabus</SelectItem> 
              </SelectContent>
            </Select>
            
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={resetFilters} className="w-full sm:w-auto sm:col-span-1 lg:col-span-1">
                <X className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            )}

            {/* Update the Fetch All Tests button to show loading state */}
            <Button 
              variant="outline" 
              onClick={handleFetchAllTests} 
              className="flex items-center justify-center"
              disabled={isFetchingAll}
            >
              {isFetchingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Fetch All Tests
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-200 rounded-md">
          Error: {error}
                    </div>
      )}

      <Card>
         <CardHeader>
            <CardTitle>Test List ({totalTests})</CardTitle>
            {/* Add Sorting controls here if needed */}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam Type</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-500 border-t-transparent"></div>
                      <p className="mt-2">Loading tests...</p>
                    </TableCell>
                  </TableRow>
                ) : tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">No tests found matching your criteria.</TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test._id}>
                      <TableCell className="font-medium">
                        <button 
                          onClick={() => router.push(`/admin/tests/view/${test._id}`)}
                          className="hover:text-green-600 hover:underline text-left font-medium cursor-pointer transition-colors"
                        >
                          {test.title}
                        </button>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline">{test.testCategory}{test.platformTestType ? ` (${test.platformTestType})` : test.year ? ` (${test.year})` : ''}</Badge>
                      </TableCell>
                      <TableCell>{test.subject}</TableCell>
                      <TableCell>{test.examType}</TableCell>
                      <TableCell>{test.class}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                test.status === 'published' ? 'bg-green-100 text-green-800' : 
                                test.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                              }`}
                              disabled={updatingStatusId === test._id}
                            >
                              {updatingStatusId === test._id ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <Tag className="w-3 h-3 mr-1" />
                                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                </>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {['draft', 'published', 'archived'].map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => test.status !== status && handleStatusChange(test._id, status as 'draft' | 'published' | 'archived')}
                                disabled={test.status === status || updatingStatusId === test._id}
                                className="flex items-center"
                              >
                                {test.status === status && (
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                                )}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{test.questionCount}</TableCell>
                      <TableCell>{test.totalMarks}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">...</Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => router.push(`/admin/tests/view/${test._id}`)}>
                                 <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => router.push(`/admin/tests/edit/${test._id}`)}>
                                 <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openDeleteDialog(test)} className="text-red-600">
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
                    </div>
        </CardContent>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages || loading}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test
              <span className="font-semibold"> "{testToDelete?.title}"</span>. Associated attempt history might remain unless explicitly cleaned up.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Yes, delete test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
