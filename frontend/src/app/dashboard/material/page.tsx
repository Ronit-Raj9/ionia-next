"use client";

import { FiBook, FiSearch, FiFilter } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { motion } from "framer-motion";

// Sample material data
const sampleMaterials = [
  { id: 1, title: "Physics - Kinematics Notes", subject: "Physics", type: "Notes" },
  { id: 2, title: "Chemistry - Organic Chemistry Basics", subject: "Chemistry", type: "Video" },
  { id: 3, title: "Mathematics - Calculus Cheat Sheet", subject: "Mathematics", type: "PDF" },
  { id: 4, title: "Biology - Cell Structures", subject: "Biology", type: "Notes" },
  { id: 5, title: "Physics - Thermodynamics Explained", subject: "Physics", type: "Video" },
  { id: 6, title: "Chemistry - Periodic Table Interactive", subject: "Chemistry", type: "Interactive" },
];

export default function MaterialPage() {
  return (
    <div className="p-6 max-w-full">
      {/* Header Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
          <FiBook className="mr-3 text-emerald-600" />
          Study Material
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Browse and access study materials, notes, and videos.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials by title or topic..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <FiFilter />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleMaterials.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-base text-gray-800">{material.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  {material.subject}
                </span>
                <span className="text-xs text-gray-500">{material.type}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
