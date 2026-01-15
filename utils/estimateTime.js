export const calculateEstimatedTime = (itemCount) => {
  // Base time of 15 minutes + 5 minutes per item, with a max of 45 minutes
  const baseTime = 15;
  const timePerItem = 5;
  const maxTime = 45;
  const minTime = 10;

  const calculatedTime = baseTime + (itemCount * timePerItem);
  return Math.max(minTime, Math.min(calculatedTime, maxTime));
};