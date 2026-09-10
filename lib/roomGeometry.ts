// A single 2:1 projection for architecture, floor details and owned objects.
export const ROOM_SCENE = { width: 600, height: 480, originX: 300, originY: 184, stepX: 36, stepY: 18, wallHeight: 144 };

export function roomPoint(x: number, y: number, elevation = 0) {
  return { x: ROOM_SCENE.originX + (x - y) * ROOM_SCENE.stepX,
    y: ROOM_SCENE.originY + (x + y) * ROOM_SCENE.stepY - elevation };
}

export function roomSceneWidth(containerWidth: number) {
  return Math.max(1, Math.min(560, containerWidth));
}
