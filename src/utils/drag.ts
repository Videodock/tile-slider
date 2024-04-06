export type Position = { x: number; y: number };
export type TouchMoves = { position: Position; ts: number }[];

export const registerMove = (lastMoves: TouchMoves, position: Position) => {
  return [{ position, ts: Date.now() }, ...lastMoves].slice(0, 2);
};

export const getVelocity = (lastMoves: TouchMoves) => {
  const distance = lastMoves[0]?.position.x - lastMoves[1]?.position.x;
  const time = lastMoves[0]?.ts - lastMoves[1]?.ts;

  return distance * (time / 32);
};
