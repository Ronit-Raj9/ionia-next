"use client";

import { useState, useEffect } from "react";
import { useUserManagement } from "@/lib/hooks/useUserManagement";
// import { User } from "@/lib/api/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";

// Icons
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  MagnifyingGlassIcon, 
  UserGroupIcon, 
  UserIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CalendarIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const AdminUsersPage = () => {
  const router = useRouter();
  const {
    users,
    loading,
    error,
    pagination,
    analytics,
    selectedUser,
    isUpdatingRole,
    isSuperAdmin,
    isAdmin,
    filters,
    updateFilters,
    fetchUsers,
    fetchUserDetails,
    changeUserRole,
  } = useUserManagement();

  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user has permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  // Handle search
  const handleSearch = () => {
    updateFilters({ search: searchTerm, page: 1 });
  };

  // Handle filter by role
  const handleRoleFilter = (role: string) => {
    updateFilters({ role, page: 1 });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  // View user details
  const handleViewUser = async (userId: string) => {
    await fetchUserDetails(userId);
    setIsUserDetailOpen(true);
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      await changeUserRole(userId, newRole);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <ArrowPathIcon className="h-12 w-12 mx-auto text-primary animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">Loading User Management...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <XMarkIcon className="h-12 w-12 mx-auto text-red-500" />
            <h3 className="mt-4 text-lg font-semibold text-red-700">Error Loading Users</h3>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => fetchUsers()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Make sure null check is present on pagination
  console.log("Pagination:", pagination);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage users, view analytics, and control user roles.
          </p>
        </div>

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900">{analytics.totalUsers}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">New This Week</p>
                  <h3 className="text-3xl font-bold text-gray-900">{analytics.newUsersThisWeek}</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <CalendarIcon className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active Users</p>
                  <h3 className="text-3xl font-bold text-gray-900">{analytics.newUsersThisWeek}</h3>
                </div>
                <div className="bg-purple-50 p-3 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">User Roles</p>
                  <div className="flex items-center mt-1 gap-3">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
                      <span className="text-xs text-gray-500">{analytics.usersByRole.user}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-yellow-500 mr-1"></div>
                      <span className="text-xs text-gray-500">{analytics.usersByRole.admin}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-xs text-gray-500">{analytics.usersByRole.superadmin}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-full">
                  <BriefcaseIcon className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleSearch}
                className="absolute left-0 top-0 mt-2 ml-3 text-gray-400"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              <button
                onClick={() => handleRoleFilter("")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filters.role === "" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleRoleFilter("user")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                  filters.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <UserIcon className="h-3 w-3 mr-1" />
                Users
              </button>
              <button
                onClick={() => handleRoleFilter("admin")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                  filters.role === "admin" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <BriefcaseIcon className="h-3 w-3 mr-1" />
                Admins
              </button>
              <button
                onClick={() => handleRoleFilter("superadmin")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center ${
                  filters.role === "superadmin" ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                Superadmins
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          {loading && users.length > 0 && (
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center">
              <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              <span className="text-blue-700 text-sm font-medium">Refreshing user data...</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {user.avatar ? (
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar}
                              alt={user.fullName}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "superadmin"
                            ? "bg-red-100 text-red-800"
                            : user.role === "admin"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "superadmin" && (
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                        )}
                        {user.role === "admin" && (
                          <BriefcaseIcon className="h-3 w-3 mr-1" />
                        )}
                        {user.role === "user" && <UserIcon className="h-3 w-3 mr-1" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewUser(user._id)}
                        className="text-primary hover:text-primary-dark mr-3"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {isSuperAdmin && user.role !== "superadmin" && (
                        user.role === "admin" ? (
                          <button
                            onClick={() => handleRoleChange(user._id, "user")}
                            disabled={isUpdatingRole}
                            className="text-yellow-600 hover:text-yellow-800 relative group"
                          >
                            <UserIcon className="h-5 w-5" />
                            <span className="hidden group-hover:block absolute right-0 top-full mt-1 p-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                              Change to User
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user._id, "admin")}
                            disabled={isUpdatingRole}
                            className="text-blue-600 hover:text-blue-800 relative group"
                          >
                            <BriefcaseIcon className="h-5 w-5" />
                            <span className="hidden group-hover:block absolute right-0 top-full mt-1 p-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                              Change to Admin
                            </span>
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(pagination.currentPage - 1) * (filters.limit || 10) + 1} to{" "}
                {Math.min(pagination.currentPage * (filters.limit || 10), pagination.totalUsers)} of{" "}
                {pagination.totalUsers} users
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    !pagination.hasPrevPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only current page, first, last, and one page before/after current
                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.totalPages ||
                    Math.abs(pageNumber - pagination.currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 mx-1 rounded-md text-sm font-medium ${
                          pagination.currentPage === pageNumber
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    (pageNumber === 2 && pagination.currentPage > 3) ||
                    (pageNumber === pagination.totalPages - 1 &&
                      pagination.currentPage < pagination.totalPages - 2)
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 py-1 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    !pagination.hasNextPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {isUserDetailOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* User Info */}
                <div className="md:w-1/3">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 relative mb-4">
                      {selectedUser.avatar ? (
                        <Image
                          src={selectedUser.avatar}
                          alt={selectedUser.fullName}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-center">
                      {selectedUser.fullName}
                    </h3>
                    <p className="text-gray-500 text-center">@{selectedUser.username}</p>
                    <p className="text-sm text-gray-500 text-center mt-1">
                      {selectedUser.email}
                    </p>

                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.role === "superadmin"
                            ? "bg-red-100 text-red-800"
                            : selectedUser.role === "admin"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selectedUser.role === "superadmin" && (
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        )}
                        {selectedUser.role === "admin" && (
                          <BriefcaseIcon className="h-4 w-4 mr-1" />
                        )}
                        {selectedUser.role === "user" && <UserIcon className="h-4 w-4 mr-1" />}
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                    </div>

                    {/* Role Management - only for superadmins */}
                    {isSuperAdmin && selectedUser.role !== "superadmin" && (
                      <div className="mt-8 w-full">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Role Management</h4>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRoleChange(selectedUser._id, "user")}
                            disabled={isUpdatingRole || selectedUser.role === "user"}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
                              selectedUser.role === "user"
                                ? "bg-blue-100 text-blue-800 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            <UserIcon className="h-4 w-4 mr-2" />
                            Make User
                          </button>
                          <button
                            onClick={() => handleRoleChange(selectedUser._id, "admin")}
                            disabled={isUpdatingRole || selectedUser.role === "admin"}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
                              selectedUser.role === "admin"
                                ? "bg-yellow-100 text-yellow-800 cursor-not-allowed"
                                : "bg-yellow-600 text-white hover:bg-yellow-700"
                            }`}
                          >
                            <BriefcaseIcon className="h-4 w-4 mr-2" />
                            Make Admin
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 w-full">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Account Info</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-500 text-sm">Joined</span>
                          <span className="text-gray-900 text-sm font-medium">
                            {formatDate(selectedUser.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-500 text-sm">Last Updated</span>
                          <span className="text-gray-900 text-sm font-medium">
                            {formatDate(selectedUser.updatedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-500 text-sm">User ID</span>
                          <span className="text-gray-900 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {selectedUser._id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Analytics */}
                <div className="md:w-2/3">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-primary" />
                    User Analytics
                  </h3>

                  {selectedUser?.analytics ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center mb-4">
                          <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                          <h4 className="text-sm font-medium text-gray-700">Total Tests Taken</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {selectedUser.analytics?.totalTests || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {selectedUser.analytics?.testsThisWeek || 0} tests this week
                        </p>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center mb-4">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <h4 className="text-sm font-medium text-gray-700">Average Score</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {(selectedUser.analytics?.averageScore || 0).toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${selectedUser.analytics?.averageScore || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center mb-4">
                          <CheckCircleIcon className="h-5 w-5 text-purple-500 mr-2" />
                          <h4 className="text-sm font-medium text-gray-700">Accuracy</h4>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          {(selectedUser.analytics?.accuracy || 0).toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${selectedUser.analytics?.accuracy || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <DocumentTextIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-gray-600 font-medium mb-2">No Analytics Available</h4>
                      <p className="text-gray-500 text-sm">
                        This user hasn't taken any tests yet or analytics couldn't be loaded.
                      </p>
                    </div>
                  )}

                  {/* Additional Actions */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-4">Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Link 
                        href={`/admin/user/${selectedUser._id}/tests`}
                        className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />
                        View Test History
                      </Link>
                      
                      <button 
                        className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        onClick={() => {
                          window.location.href = `mailto:${selectedUser.email}`;
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
