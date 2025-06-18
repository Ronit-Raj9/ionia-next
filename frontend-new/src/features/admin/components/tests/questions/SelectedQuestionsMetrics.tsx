import { Badge } from "@/components/ui/badge";
import { SelectedQuestionsMetrics as SelectedQuestionsMetricsType } from "./types";

interface SelectedQuestionsMetricsProps {
  metrics: SelectedQuestionsMetricsType;
}

export function SelectedQuestionsMetrics({ metrics }: SelectedQuestionsMetricsProps) {
  if (metrics.count === 0) {
    return null;
  }

  return (
    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mt-6">
      <h3 className="font-medium text-emerald-800 mb-2">Selected Questions Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded p-3 shadow-sm border border-emerald-100">
          <p className="text-sm text-gray-600">Total Questions</p>
          <p className="text-2xl font-bold text-emerald-700">{metrics.count}</p>
        </div>
        <div className="bg-white rounded p-3 shadow-sm border border-emerald-100">
          <p className="text-sm text-gray-600">Total Marks</p>
          <p className="text-2xl font-bold text-emerald-700">{metrics.totalMarks}</p>
        </div>
        <div className="bg-white rounded p-3 shadow-sm border border-emerald-100">
          <p className="text-sm text-gray-600">Difficulty Breakdown</p>
          <div className="flex gap-2 mt-1">
            {metrics.difficultyCounts.easy && (
              <Badge variant="default" className="bg-emerald-500">
                Easy: {metrics.difficultyCounts.easy}
              </Badge>
            )}
            {metrics.difficultyCounts.medium && (
              <Badge variant="secondary">
                Medium: {metrics.difficultyCounts.medium}
              </Badge>
            )}
            {metrics.difficultyCounts.hard && (
              <Badge variant="destructive">
                Hard: {metrics.difficultyCounts.hard}
              </Badge>
            )}
          </div>
        </div>
        <div className="bg-white rounded p-3 shadow-sm border border-emerald-100">
          <p className="text-sm text-gray-600">Subject Distribution</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(metrics.subjectCounts)
              .slice(0, 3) // Limit to first 3 subjects to avoid overflow
              .map(([subject, count]) => (
                <Badge key={subject} variant="outline" className="bg-white">
                  {subject.replace(/_/g, ' ').slice(0, 15)}: {count}
                </Badge>
              ))}
            {Object.keys(metrics.subjectCounts).length > 3 && (
              <Badge variant="outline">
                +{Object.keys(metrics.subjectCounts).length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 