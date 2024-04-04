export type Position = { x: number; y: number };
export type TouchMoves = { position: Position; ts: number }[];

export const registerMove = (lastMoves: TouchMoves, position: Position) => {
  return [{ position, ts: Date.now() }, ...lastMoves].filter((move) => Date.now() - move.ts < 500);
};

export const getVelocity = (lastMoves: TouchMoves) => {
  const distance = lastMoves[0]?.position.x - lastMoves[lastMoves.length - 1]?.position.x;
  const time = lastMoves[0]?.ts - lastMoves[lastMoves.length - 1]?.ts;

  // clamp velocity to -2 and 2
  return Math.max(-2, Math.min(distance / time, 2));
};
