// api.ts

// Common fetch configuration
const fetchConfig = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Fetch all questions
export const fetchQuestions = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, fetchConfig);
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, fetchConfig);

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}`, fetchConfig);

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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}`, {
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, fetchConfig),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, fetchConfig)
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

export async function createPaper(paperData: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paperData),
    });

    if (!response.ok) {
      throw new Error('Failed to create paper');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating paper:', error);
    throw error;
  }
}

export async function fetchAllPapers() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch papers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching papers:', error);
    throw error;
  }
}

export async function fetchPaperById(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch paper');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching paper:', error);
    throw error;
  }
}

export async function deletePaper(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete paper');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting paper:', error);
    throw error;
  }
}

// This is a singleton that maintains a list of papers
// and updates them as needed.
class PaperStore {
  private papers: any[] = [];
  private loading = false;
  private loaded = false;
  private listeners: Function[] = [];

  public subscribe(listener: Function) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.papers));
  }

  public async loadPapers() {
    if (this.loading) return;
    this.loading = true;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      this.papers = data.data || [];
      this.loaded = true;
      this.notify();
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      this.loading = false;
    }
  }

  public getPapers() {
    if (!this.loaded && !this.loading) {
      this.loadPapers();
    }
    return this.papers;
  }

  public isLoading() {
    return this.loading;
  }

  public async addPaper(paper: any) {
    this.papers.push(paper);
    this.notify();
  }

  public async removePaper(id: string) {
    this.papers = this.papers.filter(p => p._id !== id);
    this.notify();
  }
}

export const paperStore = new PaperStore();
