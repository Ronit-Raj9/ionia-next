export const fetchAnalysisData = async (paperId: string) => {
  try {
    console.log("Paper ID in api request:", paperId);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/analysis/${paperId}`);
    console.log("Response:", response);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    return data;
  } catch {
    throw new Error('Failed to fetch data');
  }
};
