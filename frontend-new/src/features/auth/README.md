# 🔐 Complete Authentication System

This is a production-ready authentication system built with **Next.js 14**, **Zustand**, and **TypeScript**. It provides secure, scalable, and maintainable authentication with role-based access control.

## 🏗️ Architecture Overview

### Core Components

1. **🧠 Zustand Store Layer** - Centralized state management
2. **🌐 Auth Service Layer** - Backend communication
3. **🔧 Auth API Layer** - HTTP interceptors with token refresh
4. **🛡️ Route Protection Layer** - Protected routes and guards
5. **🎣 Custom Hooks Layer** - React integration
6. **💾 Caching Layer** - Smart API response caching
7. **🎨 UI Store** - Global UI state (notifications, modals, etc.)

## 🚀 Quick Start

### 1. Environment Setup

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 2. Wrap Your App with Providers

```tsx
// app/layout.tsx
import { AuthProvider } from '@/providers/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Protect Your Routes

```tsx
// app/(protected)/dashboard/page.tsx
import { ProtectedRoute } from '@/features/auth/components';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <h1>Dashboard - Only authenticated users can see this</h1>
    </ProtectedRoute>
  );
}
```

### 4. Role-Based Protection

```tsx
// app/(admin)/admin/page.tsx
import { RoleGuard } from '@/features/auth/components';

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <h1>Admin Panel - Only admins can see this</h1>
    </RoleGuard>
  );
}
```

### 5. Permission-Based Protection

```tsx
// components/DeleteButton.tsx
import { PermissionGuard } from '@/features/auth/components';

export function DeleteButton() {
  return (
    <PermissionGuard requiredPermissions={['admin:users:delete']}>
      <button className="bg-red-500 text-white px-4 py-2 rounded">
        Delete User
      </button>
    </PermissionGuard>
  );
}
```

## 📚 Usage Examples

### Login Form

```tsx
'use client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useState } from 'react';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(credentials.email, credentials.password);
    
    if (result.success) {
      // Redirect will happen automatically
      console.log('Login successful!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials(prev => ({ 
            ...prev, 
            email: e.target.value 
          }))}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>
      
      <div>
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials(prev => ({ 
            ...prev, 
            password: e.target.value 
          }))}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### User Profile Component

```tsx
'use client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.fullName}!</h2>
      
      <div className="space-y-2">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <button
        onClick={() => logout()}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
```

### Permission-Based UI

```tsx
'use client';
import { usePermissions } from '@/features/auth/hooks/useAuth';

export function AdminPanel() {
  const { hasRole, hasPermission, canAccess } = usePermissions();

  return (
    <div className="space-y-4">
      <h1>Admin Panel</h1>

      {hasRole('superadmin') && (
        <div className="bg-yellow-100 p-4 rounded">
          <h2>Super Admin Only</h2>
          <p>You have super admin privileges!</p>
        </div>
      )}

      {hasPermission('admin:users:read') && (
        <div className="bg-blue-100 p-4 rounded">
          <h2>User Management</h2>
          <button>View Users</button>
        </div>
      )}

      {canAccess('tests', 'create') && (
        <div className="bg-green-100 p-4 rounded">
          <h2>Test Management</h2>
          <button>Create New Test</button>
        </div>
      )}
    </div>
  );
}
```

### Session Management

```tsx
'use client';
import { useSession, useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect } from 'react';

export function SessionManager() {
  const { user } = useAuth();
  const { 
    isActive, 
    isExpiring, 
    remainingTime, 
    formattedRemainingTime, 
    extendSession 
  } = useSession({
    onSessionExpiring: (remainingTime) => {
      console.log(`Session expiring in ${remainingTime}ms`);
    },
    onSessionExpired: () => {
      console.log('Session expired!');
    }
  });

  if (!user || !isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <div className="text-sm">
        <p>Session: {formattedRemainingTime} remaining</p>
        
        {isExpiring && (
          <div className="mt-2">
            <p className="text-orange-600">Session expiring soon!</p>
            <button
              onClick={extendSession}
              className="mt-1 bg-blue-500 text-white px-3 py-1 rounded text-xs"
            >
              Extend Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🛡️ Route Protection Patterns

### Layout-Level Protection

```tsx
// app/(protected)/layout.tsx
import { ProtectedRoute } from '@/features/auth/components';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav>Protected Navigation</nav>
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
```

### Page-Level Protection

```tsx
// app/profile/page.tsx
import { ProtectedRoute } from '@/features/auth/components';
import { UserProfile } from '@/components/UserProfile';

export default function ProfilePage() {
  return (
    <ProtectedRoute 
      requireAuth={true}
      redirectTo="/login"
    >
      <UserProfile />
    </ProtectedRoute>
  );
}
```

### Guest-Only Pages

```tsx
// app/auth/login/page.tsx
import { GuestOnly } from '@/features/auth/components';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <GuestOnly redirectTo="/dashboard">
      <div className="min-h-screen flex items-center justify-center">
        <LoginForm />
      </div>
    </GuestOnly>
  );
}
```

## 🔧 Configuration

### Auth Store Configuration

The auth store is automatically configured with:

- ✅ Persistent storage (localStorage)
- ✅ Automatic token refresh
- ✅ Session management
- ✅ Role-based permissions
- ✅ Automatic logout on token expiry

### Backend Integration

Your Node.js backend should provide these endpoints:

```
POST /api/v1/users/login
POST /api/v1/users/logout
POST /api/v1/users/register
POST /api/v1/users/refresh-token
GET  /api/v1/users/profile
POST /api/v1/users/forgot-password
POST /api/v1/users/reset-password
```

## 🎯 Advanced Features

### Token Management

- ✅ Automatic token refresh before expiry
- ✅ Concurrent request handling during refresh
- ✅ Secure token storage
- ✅ Token validation and cleanup

### Session Management

- ✅ Inactivity tracking
- ✅ Session timeout warnings
- ✅ Device-based sessions
- ✅ Session extension

### Caching

- ✅ Intelligent API response caching
- ✅ Tag-based cache invalidation
- ✅ Memory-efficient LRU eviction
- ✅ Automatic cleanup

### Error Handling

- ✅ User-friendly error messages
- ✅ Network error recovery
- ✅ Automatic retry logic
- ✅ Global error notifications

## 🛠️ Development Tools

### Debug Mode

Enable debug logging in development:

```tsx
// app/layout.tsx
<AuthProvider 
  config={{
    enableDebugLogs: process.env.NODE_ENV === 'development'
  }}
>
```

### Testing Utilities

```tsx
// Access auth state in tests
import { useAuthStore } from '@/features/auth/store/authStore';

// Mock login for testing
useAuthStore.getState().setUser(mockUser);
useAuthStore.getState().setTokens('mock-token', 'mock-refresh');
```

## 📦 What's Included

### Stores
- ✅ Auth Store (Zustand + persistence)
- ✅ UI Store (notifications, modals, loading)
- ✅ Cache Store (intelligent caching)

### Components
- ✅ ProtectedRoute
- ✅ RoleGuard
- ✅ PermissionGuard
- ✅ GuestOnly

### Hooks
- ✅ useAuth
- ✅ usePermissions
- ✅ useSession
- ✅ useTokenManager
- ✅ useAutoRefresh

### Services
- ✅ AuthService (backend communication)
- ✅ AuthAPI (HTTP layer)
- ✅ Token management
- ✅ Error handling

### Types
- ✅ Complete TypeScript definitions
- ✅ Role and permission types
- ✅ API response types
- ✅ Error types

## 🔐 Security Features

- ✅ Secure token storage
- ✅ Automatic token refresh
- ✅ CSRF protection (cookies with credentials)
- ✅ XSS protection (no token in localStorage for sensitive apps)
- ✅ Role-based access control
- ✅ Permission-based access control
- ✅ Session timeout management
- ✅ Device tracking
- ✅ Automatic logout on security events

## 🚀 Production Ready

This authentication system is production-ready with:

- ✅ Error boundaries and fallbacks
- ✅ Loading states
- ✅ Offline handling
- ✅ Memory leak prevention
- ✅ Performance optimization
- ✅ SEO-friendly
- ✅ Accessibility support
- ✅ Mobile responsive
- ✅ TypeScript strict mode
- ✅ Comprehensive testing support

## 📖 API Reference

See the individual files for detailed API documentation:

- `authStore.ts` - State management
- `authService.ts` - Backend communication  
- `authApi.ts` - HTTP layer
- `useAuth.ts` - React hooks
- `ProtectedRoute.tsx` - Route protection
- `types.ts` - TypeScript definitions