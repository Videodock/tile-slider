export type AnimationFn = (currentTime: number, startValue: number, changeInValue: number, duration: number) => number;

export const easeOut: AnimationFn = (currentTime, startValue, changeInValue, duration) => {
  currentTime /= duration;
  currentTime--;
  return changeInValue * (currentTime * currentTime * currentTime + 1) + startValue;
};

export const easeOutQuartic: AnimationFn = (currentTime, startValue, changeInValue, duration) => {
  currentTime /= duration;
  currentTime--;
  return -changeInValue * (currentTime * currentTime * currentTime * currentTime - 1) + startValue;
};

export const easeInOutCubic: AnimationFn = (currentTime, startValue, changeInValue, duration) => {
  currentTime /= duration;
  return (
    changeInValue * (currentTime < 0.5 ? 4 * currentTime * currentTime * currentTime : 1 - Math.pow(-2 * currentTime + 2, 3) / 2) +
    startValue
  );
};

export const easeInOut: AnimationFn = (currentTime, startValue, changeInValue, duration) => {
  currentTime /= duration / 2;
  if (currentTime < 1) {
    return (changeInValue / 2) * currentTime * currentTime + startValue;
  }
  currentTime--;
  return (-changeInValue / 2) * (currentTime * (currentTime - 2) - 1) + startValue;
};

export function clampWithEasing(value: number, minValue: number, maxValue: number, easingDistance = 50) {
  if (value < minValue) {
    return minValue - Math.min(easingDistance, easeOut(minValue - value, 0, easingDistance, easingDistance * 4));
  }

  if (value > maxValue) {
    return Math.min(easingDistance, easeOut(value - maxValue, 0, easingDistance, easingDistance * 4));
  }

  return value;
}
