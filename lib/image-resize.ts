/**
 * Browser-only: turns a photo into a small square data URL. Center-crops to a
 * square, scales to `size` px and re-encodes as JPEG (~10 KB), so it can live in
 * a database column instead of needing file storage.
 */
export async function photoToSquareDataUrl(file: File, size = 192): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Couldn't read that image. Try a JPG or PNG.");
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image.");

  // JPEG has no transparency, so paint the surface color under logos with clear backgrounds.
  ctx.fillStyle = "#fbf6f0";
  ctx.fillRect(0, 0, size, size);

  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}
