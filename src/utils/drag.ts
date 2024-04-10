export type Position = { x: number; y: number };
export type TouchMoves = { position: Position; ts: number }[];

export const registerMove = (lastMoves: TouchMoves, position: Position) => {
  return [{ position, ts: Date.now() }, ...lastMoves].slice(0, 5).filter((move) => move.ts > Date.now() - 100);
};

export const getVelocity = (lastMoves: TouchMoves) => {
  if (lastMoves.length < 2) return 0;

  const distance = lastMoves[0].position.x - lastMoves[lastMoves.length - 1].position.x;
  const time = lastMoves[0].ts - lastMoves[lastMoves.length - 1].ts;

  return distance * (time / 32);
};
