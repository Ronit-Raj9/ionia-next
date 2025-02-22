"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";

interface IUserData {
  username: string;
  role?: string; // Additional fields can be added as needed
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<IUserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "JEE Mains", href: "/exam/jee-mains" },
    { name: "JEE Advanced", href: "/exam/jee-advanced" },
    { name: "CUET", href: "/exam/cuet" },
    { name: "Practice", href: "/practice" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/current-user`,
          {
            credentials: "include", // Important for sending cookies
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.ok) {
          // Expected response shape:
          // {
          //   statusCode: 200,
          //   data: { username: '...', role: '...' },
          //   message: '...',
          //   success: true
          // }
          const userData = await response.json();
          setUser({
            username: userData.data.username,
            role: userData.data.role,
          });
          console.log("User data:", userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo or Title */}
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">TestSeries</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                {item.name}
              </Link>
            ))}
            {/* Add Admin Panel button if user is admin */}
            {user && user.role === "admin" && (
              <Link
                href="/admin"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Admin Panel
              </Link>
            )}
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
              >
                <User className="text-blue-600" size={20} />
                <span>{user.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Navigation Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* Add Admin Panel button if user is admin */}
              {user && user.role === "admin" && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 hover:bg-blue-50 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="text-blue-600" size={20} />
                  <span>{user.username}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
