export const getCircularIndex = (index: number, length: number) => ((index % length) + length) % length;
