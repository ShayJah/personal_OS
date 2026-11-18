export type Pt = { x: number; y: number };

/** CSS matrix3d that maps a w×h box (origin top-left) onto the quad q = [TL, TR, BR, BL] (px). */
export function quadMatrix3d(w: number, h: number, q: [Pt, Pt, Pt, Pt]): string {
  // Solve the 8 unknowns of the projective transform from 4 point pairs (Gaussian elimination).
  const src: Pt[] = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = q[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u]);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const [a, b, c, d, e, f, g, h2] = A.map((row, i) => row[8] / row[i]);
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h2},0,0,1,0,${c},${f},0,1)`;
}

/** Applies the same transform to a point, for tests. */
export function applyQuad(w: number, h: number, q: [Pt, Pt, Pt, Pt], p: Pt): Pt {
  const m = quadMatrix3d(w, h, q).slice(9, -1).split(",").map(Number);
  const [a, d, , g, b, e, , h2, , , , , c, f] = m;
  const den = g * p.x + h2 * p.y + 1;
  return { x: (a * p.x + b * p.y + c) / den, y: (d * p.x + e * p.y + f) / den };
}
