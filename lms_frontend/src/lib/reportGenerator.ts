import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Progress, StudentProfile, Class } from './db';
import { uploadFile } from './cloudinary';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  classMetrics: {
    totalStudents: number;
    averageScore: number;
    completionRate: number;
    totalSubmissions: number;
    totalTimeSaved: number;
  };
  studentProgress: {
    studentId: string;
    name: string;
    averageScore: number;
    completionRate: number;
    strengths: string[];
    weaknesses: string[];
    badges: number;
    recentActivity: string;
  }[];
  heatmap: {
    topic: string;
    percentage: number;
    studentsAffected: number;
  }[];
  trends: {
    week: string;
    averageScore: number;
    completionRate: number;
  }[];
}

// Generate PDF report
export async function generatePDFReport(
  reportData: ReportData,
  reportType: 'progress' | 'analytics' | 'parent_summary',
  className: string = 'Demo Class'
): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // Emerald color
  doc.text('EduFlow AI - Learning Analytics Report', 20, 25);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Class: ${className}`, 20, 35);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
  doc.text(`Report Type: ${reportType.replace('_', ' ').toUpperCase()}`, 20, 55);

  let yPosition = 70;

  if (reportType === 'analytics' || reportType === 'progress') {
    // Class Overview Section
    doc.setFontSize(16);
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text('Class Overview', 20, yPosition);
    yPosition += 15;

    const overviewData = [
      ['Metric', 'Value'],
      ['Total Students', reportData.classMetrics.totalStudents.toString()],
      ['Average Score', `${reportData.classMetrics.averageScore}%`],
      ['Completion Rate', `${reportData.classMetrics.completionRate}%`],
      ['Total Submissions', reportData.classMetrics.totalSubmissions.toString()],
      ['Time Saved (Hours)', `${Math.floor(reportData.classMetrics.totalTimeSaved / 60)}`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [overviewData[0]],
      body: overviewData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Student Performance Table
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(16);
    doc.text('Student Performance', 20, yPosition);
    yPosition += 15;

    const studentData = [
      ['Student', 'Avg Score', 'Completion', 'Badges', 'Recent Activity']
    ];

    reportData.studentProgress.forEach(student => {
      studentData.push([
        student.name,
        `${student.averageScore}%`,
        `${student.completionRate}%`,
        student.badges.toString(),
        student.recentActivity
      ]);
    });

    doc.autoTable({
      startY: yPosition,
      head: [studentData[0]],
      body: studentData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Class Weaknesses Heatmap
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(16);
    doc.text('Areas for Improvement', 20, yPosition);
    yPosition += 15;

    const heatmapData = [
      ['Topic', 'Difficulty %', 'Students Affected']
    ];

    reportData.heatmap.forEach(item => {
      heatmapData.push([
        item.topic,
        `${item.percentage}%`,
        item.studentsAffected.toString()
      ]);
    });

    doc.autoTable({
      startY: yPosition,
      head: [heatmapData[0]],
      body: heatmapData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }, // Red for weaknesses
      margin: { left: 20, right: 20 }
    });
  }

  if (reportType === 'parent_summary') {
    // Parent-friendly summary
    doc.setFontSize(14);
    doc.text('Dear Parents,', 20, yPosition);
    yPosition += 20;

    doc.setFontSize(12);
    const summaryText = `
Your child is making excellent progress in their mathematics learning journey with EduFlow AI. 
Here's a summary of their recent achievements and areas of focus:

• Current average score: ${reportData.classMetrics.averageScore}%
• Assignment completion rate: ${reportData.classMetrics.completionRate}%
• Learning streak: Active and engaged
• Areas of strength: Problem solving and logical thinking
• Focus areas: Continued practice in challenging topics

Our AI-powered system personalizes each assignment to match your child's learning style and pace,
ensuring optimal growth and engagement. The gamification elements help maintain motivation while
building strong mathematical foundations.

We recommend encouraging 15-20 minutes of daily practice at home to reinforce classroom learning.
Your child is developing excellent study habits and mathematical reasoning skills.

Thank you for supporting your child's learning journey!

Best regards,
The EduFlow AI Team
    `;

    const splitText = doc.splitTextToSize(summaryText, pageWidth - 40);
    doc.text(splitText, 20, yPosition);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(
      `Page ${i} of ${pageCount} | EduFlow AI Analytics`,
      pageWidth - 80,
      doc.internal.pageSize.height - 10
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}

// Generate Excel report
export async function generateExcelReport(
  reportData: ReportData,
  reportType: 'progress' | 'analytics' | 'parent_summary',
  className: string = 'Demo Class'
): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();

  // Overview Sheet
  const overviewData = [
    ['EduFlow AI - Learning Analytics Report'],
    ['Class:', className],
    ['Generated:', new Date().toLocaleDateString()],
    ['Report Type:', reportType.replace('_', ' ').toUpperCase()],
    [''],
    ['Class Metrics'],
    ['Total Students', reportData.classMetrics.totalStudents],
    ['Average Score (%)', reportData.classMetrics.averageScore],
    ['Completion Rate (%)', reportData.classMetrics.completionRate],
    ['Total Submissions', reportData.classMetrics.totalSubmissions],
    ['Time Saved (Hours)', Math.floor(reportData.classMetrics.totalTimeSaved / 60)]
  ];

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  // Student Performance Sheet
  const studentHeaders = ['Student ID', 'Name', 'Average Score (%)', 'Completion Rate (%)', 'Badges', 'Strengths', 'Weaknesses', 'Recent Activity'];
  const studentData = [studentHeaders];

  reportData.studentProgress.forEach(student => {
    studentData.push([
      student.studentId,
      student.name,
      student.averageScore.toString(),
      student.completionRate.toString(),
      student.badges.toString(),
      student.strengths.join(', '),
      student.weaknesses.join(', '),
      student.recentActivity
    ]);
  });

  const studentSheet = XLSX.utils.aoa_to_sheet(studentData);
  XLSX.utils.book_append_sheet(workbook, studentSheet, 'Student Performance');

  // Heatmap Sheet
  const heatmapHeaders = ['Topic', 'Difficulty Percentage', 'Students Affected'];
  const heatmapSheetData = [heatmapHeaders];

  reportData.heatmap.forEach(item => {
    heatmapSheetData.push([
      item.topic,
      item.percentage.toString(),
      item.studentsAffected.toString()
    ]);
  });

  const heatmapSheet = XLSX.utils.aoa_to_sheet(heatmapSheetData);
  XLSX.utils.book_append_sheet(workbook, heatmapSheet, 'Class Weaknesses');

  // Trends Sheet (if data available)
  if (reportData.trends && reportData.trends.length > 0) {
    const trendsHeaders = ['Week', 'Average Score (%)', 'Completion Rate (%)'];
    const trendsData = [trendsHeaders];

    reportData.trends.forEach(trend => {
      trendsData.push([
        trend.week,
        trend.averageScore.toString(),
        trend.completionRate.toString()
      ]);
    });

    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends');
  }

  // Convert to buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}

// Upload report to Cloudinary and return URL
export async function uploadReportToCloud(
  reportBuffer: Buffer,
  format: 'PDF' | 'Excel',
  reportType: string,
  className: string
): Promise<string> {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${className}_${reportType}_${timestamp}`;
    const folder = 'eduflow/reports';

    const result = await uploadFile(reportBuffer, filename, 'assignments');
    return result.url || '';
  } catch (error) {
    console.error('Error uploading report to cloud:', error);
    throw new Error('Failed to upload report');
  }
}

// Generate and save complete report
export async function generateAndSaveReport(
  reportData: ReportData,
  format: 'PDF' | 'Excel',
  reportType: 'progress' | 'analytics' | 'parent_summary',
  className: string = 'Demo Class'
): Promise<{ url: string; generatedAt: Date }> {
  try {
    let reportBuffer: Buffer;

    if (format === 'PDF') {
      reportBuffer = await generatePDFReport(reportData, reportType, className);
    } else {
      reportBuffer = await generateExcelReport(reportData, reportType, className);
    }

    const url = await uploadReportToCloud(reportBuffer, format, reportType, className);

    return {
      url,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error(`Failed to generate ${format} report`);
  }
}

// Prepare report data from database collections
export function prepareReportData(
  progressRecords: Progress[],
  studentProfiles: StudentProfile[],
  classData?: Class
): ReportData {
  const totalStudents = progressRecords.length;
  
  // Calculate class metrics
  const totalSubmissions = progressRecords.reduce((sum, p) => sum + (p.metrics.totalSubmissions || 0), 0);
  const averageScore = progressRecords.reduce((sum, p) => sum + (p.metrics.averageScore || 0), 0) / totalStudents;
  const completionRate = progressRecords.reduce((sum, p) => sum + (p.metrics.completionRate || 0), 0) / totalStudents;
  const totalTimeSaved = progressRecords.reduce((sum, p) => sum + (p.metrics.timeSaved || 0), 0);

  const classMetrics = {
    totalStudents,
    averageScore: Math.round(averageScore),
    completionRate: Math.round(completionRate),
    totalSubmissions,
    totalTimeSaved
  };

  // Prepare student progress data
  const studentProgress = progressRecords.map((progress, index) => {
    const profile = studentProfiles.find(p => p.studentMockId === progress.studentMockId);
    
    return {
      studentId: progress.studentMockId,
      name: `Student ${index + 1}`,
      averageScore: progress.metrics.averageScore || 0,
      completionRate: progress.metrics.completionRate || 0,
      strengths: progress.metrics.strengths || [],
      weaknesses: progress.metrics.weaknesses || [],
      badges: progress.gamificationData?.badges.length || 0,
      recentActivity: progress.recentActivity?.[0]?.description || 'No recent activity'
    };
  });

  // Prepare heatmap data (class weaknesses)
  const weaknessMap = new Map<string, number>();
  progressRecords.forEach(progress => {
    progress.metrics.weaknesses.forEach(weakness => {
      weaknessMap.set(weakness, (weaknessMap.get(weakness) || 0) + 1);
    });
  });

  const heatmap = Array.from(weaknessMap.entries())
    .map(([topic, count]) => ({
      topic,
      percentage: Math.round((count / totalStudents) * 100),
      studentsAffected: count
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10); // Top 10 weaknesses

  // Prepare trends data (mock data for demo)
  const trends = [
    { week: 'Week 1', averageScore: Math.max(0, averageScore - 15), completionRate: Math.max(0, completionRate - 20) },
    { week: 'Week 2', averageScore: Math.max(0, averageScore - 10), completionRate: Math.max(0, completionRate - 15) },
    { week: 'Week 3', averageScore: Math.max(0, averageScore - 5), completionRate: Math.max(0, completionRate - 10) },
    { week: 'Week 4', averageScore, completionRate }
  ];

  return {
    classMetrics,
    studentProgress,
    heatmap,
    trends
  };
}
