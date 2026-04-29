import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface PixelGridSpriteProps {
  palette?: Record<string, string> | null;
  grid?: string[] | null;
  size?: number;
}

function isValidGrid(grid?: string[] | null): grid is string[] {
  return Boolean(grid && grid.length > 0 && grid.every((row) => typeof row === 'string' && row.length === grid[0].length));
}

export const PixelGridSprite = memo(function PixelGridSprite({ palette, grid, size = 38 }: PixelGridSpriteProps) {
  const rows = useMemo(() => {
    if (!isValidGrid(grid) || !palette) return null;
    const height = grid.length;
    const width = grid[0].length;
    const cellSize = Math.max(1, Math.floor(size / Math.max(width, height)));
    return grid.map((row, y) =>
      row.split('').map((token, x) => ({
        key: `${x}-${y}`,
        x,
        y,
        color: palette[token] ?? '#00000000',
        cellSize,
      }))
    );
  }, [grid, palette, size]);

  if (!rows) return null;
  const cellSize = rows[0]?.[0]?.cellSize ?? 4;
  const width = rows[0].length * cellSize;
  const height = rows.length * cellSize;

  return (
    <View style={[styles.wrap, { width, height }]} accessibilityLabel="Pixel sprite preview">
      {rows.flat().map((cell) => (
        <View
          key={cell.key}
          style={{
            position: 'absolute',
            left: cell.x * cell.cellSize,
            top: cell.y * cell.cellSize,
            width: cell.cellSize,
            height: cell.cellSize,
            backgroundColor: cell.color,
          }}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#EADCC6',
  },
});

