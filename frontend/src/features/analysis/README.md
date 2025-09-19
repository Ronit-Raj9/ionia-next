# Analysis Feature

This feature provides comprehensive test analysis capabilities for the Ionia platform, including performance analytics, behavioral insights, and personalized recommendations.

## 🏗️ Architecture

The analysis feature follows a layered architecture pattern:

```
📁 analysis/
├── 📁 api/           # HTTP communication layer
├── 📁 components/    # React components
├── 📁 hooks/         # Custom React hooks
├── 📁 services/      # Business logic layer
├── 📁 store/         # State management (Zustand)
└── 📁 types/         # TypeScript type definitions
```

## 🔄 Data Flow

1. **API Layer** (`api/analysisApi.ts`) - Handles HTTP requests and responses
2. **Service Layer** (`services/analysisService.ts`) - Contains business logic and data transformation
3. **Store Layer** (`store/analysisStore.ts`) - Manages application state using Zustand
4. **Hook Layer** (`hooks/useAnalysisData.tsx`) - Provides React hooks for data fetching
5. **Component Layer** (`components/AnalysisWindow/`) - React components for UI

## 🚀 Quick Start

### Basic Usage

```tsx
import { AnalysisWindow } from '@/features/analysis';

function MyComponent() {
  return (
    <AnalysisWindow 
      examType="jee"
      paperId="paper123"
      attemptId="attempt456"
    />
  );
}
```

### Using the Store

```tsx
import { useAnalysisStore, useCurrentAnalysis } from '@/features/analysis';

function MyComponent() {
  const { currentAnalysis, isLoading, error } = useCurrentAnalysis();
  const { setAnalysisData, setLoading } = useAnalysisStore();

  // Your component logic
}
```

### Using the API

```tsx
import { getTestAnalysis, transformAnalysisData } from '@/features/analysis';

async function fetchAnalysis(attemptId: string) {
  try {
    const rawData = await getTestAnalysis(attemptId);
    const analysisData = transformAnalysisData(rawData);
    return analysisData;
  } catch (error) {
    console.error('Failed to fetch analysis:', error);
  }
}
```

## 📊 Available Analysis Types

### 1. Performance Analysis
- Overall score and accuracy
- Subject-wise performance breakdown
- Difficulty level analysis
- Time management metrics

### 2. Behavioral Analysis
- Navigation patterns
- Question revisit frequency
- Confidence metrics
- Interaction patterns

### 3. Error Analysis
- Common mistake patterns
- Conceptual vs calculation errors
- Time spent before errors
- Error categorization

### 4. Time Analysis
- Time distribution across questions
- Subject-wise time allocation
- Time efficiency scoring
- Quality time spent metrics

### 5. Strategy Analysis
- Question selection patterns
- Section completion rates
- Time management strategies
- Performance optimization insights

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://your-api-url/api/v1
```

### API Endpoints

The feature expects the following API endpoints:

- `GET /attempted-tests/analysis` - Get test analysis by attempt ID
- `GET /analytics/test/{testId}` - Get analysis data for a test
- `GET /analytics/history` - Get user's analysis history
- `GET /analytics/performance-trends` - Get performance trends
- `GET /analytics/subject-analysis` - Get subject-wise analysis
- `GET /analytics/time-analytics` - Get time analytics
- `GET /analytics/error-analysis` - Get error analysis
- `GET /analytics/behavioral-insights` - Get behavioral insights
- `GET /analytics/recommendations` - Get personalized recommendations

## 📝 Data Structures

### AnalysisData Interface

```typescript
interface AnalysisData {
  testId: string;
  userId: string;
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  accuracy: number;
  timeTaken: number;
  questionAnalysis: QuestionAnalysis[];
  subjectPerformance: SubjectPerformance[];
  timeAnalysis: TimeAnalysis;
  difficultyAnalysis: DifficultyAnalysis;
  comparisonData?: ComparisonData;
  recommendations: {
    strengths: string[];
    improvements: string[];
    studyPlan: string[];
  };
  generatedAt: string;
  version: string;
}
```

## 🎯 Features

### ✅ Implemented
- [x] Performance analysis with charts and metrics
- [x] Subject-wise analysis breakdown
- [x] Time analysis and efficiency scoring
- [x] Error analysis with categorization
- [x] Behavioral analysis with navigation patterns
- [x] Strategy analysis with completion metrics
- [x] Question-level analysis
- [x] Personalized recommendations
- [x] Multiple attempt support
- [x] Responsive design
- [x] Error handling and loading states
- [x] Data validation and transformation

### 🚧 Planned
- [ ] Comparative analysis with peer data
- [ ] Advanced filtering and search
- [ ] Export functionality (PDF, Excel)
- [ ] Real-time analytics updates
- [ ] Machine learning insights
- [ ] Custom dashboard creation

## 🛠️ Development

### Adding New Analysis Types

1. **Add API endpoint** in `api/analysisApi.ts`
2. **Add service method** in `services/analysisService.ts`
3. **Add component** in `components/AnalysisWindow/`
4. **Update store** if needed in `store/analysisStore.ts`
5. **Add to index** in `index.ts`

### Example: Adding a New Analysis Component

```tsx
// components/AnalysisWindow/NewAnalysis.tsx
import React from 'react';

interface NewAnalysisProps {
  data: any;
}

const NewAnalysis: React.FC<NewAnalysisProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-medium mb-4">New Analysis</h2>
      {/* Your analysis content */}
    </div>
  );
};

export default NewAnalysis;
```

Then add it to the AnalysisWindow component and index file.

## 🧪 Testing

### Unit Tests

```bash
npm test -- --testPathPattern=analysis
```

### Integration Tests

```bash
npm run test:integration -- --testPathPattern=analysis
```

## 📚 API Documentation

### getTestAnalysis(attemptId, paperId?)

Fetches detailed test analysis data.

**Parameters:**
- `attemptId` (string): The attempt ID
- `paperId` (string, optional): The paper ID

**Returns:** Promise<TestAnalysisResponse>

### transformAnalysisData(rawData)

Transforms raw API data into the standardized AnalysisData format.

**Parameters:**
- `rawData` (TestAnalysisResponse): Raw API response

**Returns:** AnalysisData

### calculateTimeEfficiency(timeAnalysis)

Calculates time efficiency score based on time distribution.

**Parameters:**
- `timeAnalysis` (TimeAnalysis): Time analysis data

**Returns:** number (0-100)

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for all new features
3. Include error handling and loading states
4. Write tests for new functionality
5. Update this README for any new features

## 📄 License

This feature is part of the Ionia platform and follows the same licensing terms.





