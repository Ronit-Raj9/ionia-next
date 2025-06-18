// frontend/app/dashboard/loading.tsx
"use client";
import React from 'react';
import { ClipLoader } from 'react-spinners';

export default function DashboardLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex flex-col items-center mb-8">
          <ClipLoader size={60} color="#10b981" />
          <h2 className="mt-6 text-2xl font-bold text-gray-800">Loading Your Dashboard</h2>
          <p className="mt-2 text-gray-500">Please wait while we prepare your data...</p>
        </div>
        
        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-lg font-medium text-gray-700 mb-2">What's happening?</h3>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                <span>Retrieving your test history</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                <span>Calculating your performance metrics</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                <span>Preparing your personalized insights</span>
              </li>
            </ul>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-500">Data retrieval in progress...</p>
        </div>
        
        <p className="text-sm text-gray-400 italic">
          If loading takes too long, the dashboard will display sample data so you can explore the interface.
        </p>
      </div>
    </div>
  );
}
