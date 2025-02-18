// analysis/api.ts
export const fetchAnalysisData = async (paperId: string) => {
  try {
    console.log("Paper ID in api request:", paperId);
    const response = await fetch(`http://localhost:4000/api/v1/attempted-tests/analysis/${paperId}`);
    console.log("Response:", response);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Failed to fetch data');
  }
};
