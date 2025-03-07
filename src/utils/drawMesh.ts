import { TRIANGULATION } from "./triangulation";

/**
 * Interface para pontos faciais detectados
 */
interface KeyPoint {
  x: number;
  y: number;
  z?: number;
}

/**
 * Cores para diferentes partes da malha facial
 */
const MESH_COLORS = {
  triangles: "rgba(255, 255, 255, 0.2)",
  triangleStroke: "rgba(255, 255, 255, 0.5)",
  dots: "rgba(255, 255, 255, 0.8)",
  eyes: "rgba(0, 170, 255, 0.7)",
  lips: "rgba(255, 105, 180, 0.7)",
  faceLine: "rgba(255, 255, 255, 0.6)",
};

// Índices dos pontos faciais para diferentes regiões
const LIPS_INDICES = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
  39, 40, 185,
];
const LEFT_EYE_INDICES = [
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388,
  466, 263,
];
const RIGHT_EYE_INDICES = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  33,
];
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109, 10,
];

/**
 * Desenha um caminho no contexto do canvas
 *
 * @param ctx - Contexto 2D do canvas
 * @param points - Array de pontos para desenhar
 * @param closePath - Indica se o caminho deve ser fechado
 * @param fillStyle - Estilo de preenchimento (opcional)
 * @param strokeStyle - Estilo de contorno (opcional)
 * @param lineWidth - Largura da linha (opcional)
 */
const drawPath = (
  ctx: CanvasRenderingContext2D,
  points: KeyPoint[],
  closePath: boolean,
  fillStyle?: string,
  strokeStyle?: string,
  lineWidth: number = 2
): void => {
  if (!ctx || points.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    ctx.lineTo(point.x, point.y);
  }

  if (closePath) {
    ctx.closePath();
  }

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

/**
 * Desenha a malha facial no canvas
 *
 * @param prediction - Predição facial com landmarks
 * @param ctx - Contexto 2D do canvas
 */
export const drawMesh = (
  prediction: any,
  ctx: CanvasRenderingContext2D
): void => {
  if (
    !prediction ||
    !prediction.multiFaceLandmarks ||
    prediction.multiFaceLandmarks.length === 0 ||
    !ctx
  ) {
    return;
  }

  // Obter pontos faciais do primeiro rosto detectado
  const keypoints = prediction.multiFaceLandmarks[0];

  if (!keypoints || keypoints.length === 0) {
    return;
  }

  // Escalar pontos para corresponder às dimensões do canvas
  const imageWidth = prediction.image?.width || ctx.canvas.width;
  const imageHeight = prediction.image?.height || ctx.canvas.height;

  const scaleX = ctx.canvas.width / imageWidth;
  const scaleY = ctx.canvas.height / imageHeight;

  const scaledKeypoints = keypoints.map((point: any) => ({
    x: point.x * imageWidth * scaleX,
    y: point.y * imageHeight * scaleY,
    z: point.z || 0,
  }));

  // Limpar canvas antes de desenhar
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Definir estilo de renderização
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Desenhar os triângulos da malha facial
  for (let i = 0; i < TRIANGULATION.length / 3; i++) {
    const points = [
      scaledKeypoints[TRIANGULATION[i * 3]],
      scaledKeypoints[TRIANGULATION[i * 3 + 1]],
      scaledKeypoints[TRIANGULATION[i * 3 + 2]],
    ];

    drawPath(
      ctx,
      points,
      true,
      MESH_COLORS.triangles,
      MESH_COLORS.triangleStroke,
      0.5
    );
  }

  // 2. Desenhar elementos especiais - olhos, lábios e contorno facial
  // Olhos
  const leftEyePoints = LEFT_EYE_INDICES.map((idx) => scaledKeypoints[idx]);
  drawPath(ctx, leftEyePoints, true, MESH_COLORS.eyes, MESH_COLORS.eyes, 2);

  const rightEyePoints = RIGHT_EYE_INDICES.map((idx) => scaledKeypoints[idx]);
  drawPath(ctx, rightEyePoints, true, MESH_COLORS.eyes, MESH_COLORS.eyes, 2);

  // Lábios
  const lipsPoints = LIPS_INDICES.map((idx) => scaledKeypoints[idx]);
  drawPath(ctx, lipsPoints, true, MESH_COLORS.lips, MESH_COLORS.lips, 2);

  // Contorno facial
  const faceOvalPoints = FACE_OVAL_INDICES.map((idx) => scaledKeypoints[idx]);
  drawPath(ctx, faceOvalPoints, true, undefined, MESH_COLORS.faceLine, 2);

  // 3. Desenhar pontos faciais como pequenos círculos
  const keyPointsToShow = [1, 33, 263, 61, 291, 199]; // Nariz, olhos, boca

  ctx.fillStyle = MESH_COLORS.dots;
  keyPointsToShow.forEach((index) => {
    const point = scaledKeypoints[index];
    if (point) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
};
