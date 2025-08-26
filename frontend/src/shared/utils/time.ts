export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

export const startCountdown = (initialTime: number, onTimeUp: () => void): NodeJS.Timeout => {
  let timeLeft = initialTime; // Store time in a separate variable

  const timer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timer); // ✅ Use the timer variable correctly
      onTimeUp();
    } else {
      timeLeft -= 1;
    }
  }, 1000);

  return timer; // Return the interval so it can be cleared from outside
};
