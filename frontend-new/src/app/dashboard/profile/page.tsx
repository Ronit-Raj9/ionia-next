"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Could not load user profile.</div>;
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          My Profile
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Manage your account settings and personal information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-emerald-200">
                <AvatarImage src={user.avatar || ''} alt={user.fullName || user.username} />
                <AvatarFallback className="text-3xl bg-emerald-100 text-emerald-600">
                  {getInitials(user.fullName || user.username || 'U')}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user.fullName || user.username}</CardTitle>
              <p className="text-sm text-gray-500">{user.email}</p>
            </CardHeader>
            <CardContent>
               <Button className="w-full">Change Avatar</Button>
            </CardContent>
          </Card>
        </div>

        {/* Update Information Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiUser className="mr-3 text-gray-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue={user.fullName || ''} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" defaultValue={user.username || ''} placeholder="Your username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiLock className="mr-3 text-gray-500" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" />
              </div>
              <Button>Change Password</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
