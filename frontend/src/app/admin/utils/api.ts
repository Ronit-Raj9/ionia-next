// api.ts

// Fetch all questions
export const fetchQuestions = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error("Failed to fetch questions");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

// Create a new test series
export const createTestSeries = async (testData: Record<string, unknown>) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/add`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error creating test series");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating test series:", error);
    throw error;
  }
};

// Fetch all tests
export async function fetchTests() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/get`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tests");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
}

// Fetch details for a single test by ID
export const fetchTestDetails = async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/get/${id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch test details");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching test details:", error);
    throw error;
  }
};

// Delete a test by ID
export const deleteTest = async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/delete/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete test');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

// Fetch analytics data
export const fetchAnalytics = async () => {
  try {
    const [questionsResponse, testsResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/get`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    ]);

    if (!questionsResponse.ok || !testsResponse.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const questionsData = await questionsResponse.json();
    const testsData = await testsResponse.json();

    // Add error logging to help debug
    console.log('Questions Data:', questionsData);
    console.log('Tests Data:', testsData);

    return {
      questions: questionsData.data || [],
      tests: testsData.data || []
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};
