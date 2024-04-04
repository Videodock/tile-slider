export const easeOut = (currentTime: number, startValue: number, changeInValue: number, duration: number): number => {
  currentTime /= duration;
  currentTime--;
  return changeInValue * (currentTime * currentTime * currentTime + 1) + startValue;
};

export const easeInOut = (currentTime: number, startValue: number, changeInValue: number, duration: number): number => {
  currentTime /= duration / 2;
  if (currentTime < 1) {
    return (changeInValue / 2) * currentTime * currentTime + startValue;
  }
  currentTime--;
  return (-changeInValue / 2) * (currentTime * (currentTime - 2) - 1) + startValue;
};
