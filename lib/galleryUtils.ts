export function isValidGalleryCell(x: number, y: number) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 5 && y >= 0 && y < 5;
}

