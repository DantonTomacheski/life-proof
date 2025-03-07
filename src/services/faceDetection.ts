import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { drawMesh } from "../utils/drawMesh";

// Configurações do detector
const DETECTOR_CONFIG = {
  runtime: "tfjs" as const,
  refineLandmarks: true,
  maxFaces: 1,
};

// Cache para o detector para evitar recarregá-lo
let detectorCache: faceLandmarksDetection.FaceLandmarksDetector | null = null;

/**
 * Inicializa o detector facial
 */
async function initializeDetector(): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  if (detectorCache) {
    return detectorCache;
  }

  try {
    // Carregar o modelo MediaPipe FaceMesh
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;

    const detector = await faceLandmarksDetection.createDetector(
      model,
      DETECTOR_CONFIG
    );

    detectorCache = detector;
    return detector;
  } catch (error) {
    console.error("Erro ao inicializar o detector facial:", error);
    throw new Error("Não foi possível inicializar o detector facial");
  }
}

/**
 * Executa o detector facial no vídeo e desenha a malha facial no canvas
 */
export async function runDetector(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  drawFaceMesh: boolean = true,
  onPrediction?: (prediction: any) => void
): Promise<() => void> {
  if (!video || !canvas) {
    throw new Error("Vídeo ou canvas não fornecidos");
  }

  // Obter contexto 2D do canvas
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível obter o contexto 2D do canvas");
  }

  // Limpar o canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Inicializar o detector
  const detector = await initializeDetector();

  let isRunning = true;
  let lastPrediction: any = null;

  // Função para detectar rostos continuamente
  const detect = async () => {
    if (!isRunning) return;

    try {
      // Verificar se o vídeo está pronto
      if (video.readyState === 4) {
        // Estimar faces no vídeo
        const predictions = await detector.estimateFaces(video);

        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Processar as predições
        if (predictions.length > 0) {
          const prediction = predictions[0];
          lastPrediction = prediction;

          // Desenhar a malha facial se solicitado
          if (drawFaceMesh) {
            drawMesh(prediction, ctx);
          }

          // Callback com a predição, se fornecido
          if (onPrediction) {
            onPrediction(prediction);
          }
        } else if (onPrediction && lastPrediction) {
          // Se não encontrar face, passar null para o callback
          onPrediction(null);
        }
      }

      // Continuar o loop de detecção
      requestAnimationFrame(detect);
    } catch (error) {
      console.error("Erro na detecção facial:", error);

      // Tentar novamente após 500ms em caso de erro
      setTimeout(() => {
        if (isRunning) {
          detect();
        }
      }, 500);
    }
  };

  // Iniciar o loop de detecção
  detect();

  // Retornar função para cancelar a detecção
  return () => {
    isRunning = false;
  };
}

/**
 * Captura uma única face da imagem e retorna a predição
 */
export async function captureFrame(
  image: HTMLImageElement | HTMLVideoElement | ImageData
): Promise<any> {
  try {
    const detector = await initializeDetector();
    const predictions = await detector.estimateFaces(image);

    return predictions.length > 0 ? predictions[0] : null;
  } catch (error) {
    console.error("Erro ao capturar face do frame:", error);
    return null;
  }
}

/**
 * Verifica se há um rosto na imagem
 */
export async function hasFace(
  image: HTMLImageElement | HTMLVideoElement | ImageData
): Promise<boolean> {
  try {
    const detector = await initializeDetector();
    const predictions = await detector.estimateFaces(image);

    return predictions.length > 0;
  } catch (error) {
    console.error("Erro ao verificar face na imagem:", error);
    return false;
  }
}

/**
 * Compara duas faces e retorna uma pontuação de similaridade
 * Nota: Esta é uma implementação simplificada e pode precisar de melhorias
 * para uso em produção.
 */
export async function compareFaces(faceA: any, faceB: any): Promise<number> {
  if (!faceA || !faceB) return 0;

  try {
    // Extrair pontos faciais
    const pointsA = faceA.keypoints;
    const pointsB = faceB.keypoints;

    // Verificar se os pontos existem
    if (!pointsA || !pointsB) return 0;

    // Calcular distância média entre pontos correspondentes
    let totalDistance = 0;
    let validPoints = 0;

    // Usar pontos limitados para comparação (pontos principais)
    const keyIndices = [1, 33, 263, 61, 291, 199, 6, 4, 101, 10, 152, 234];

    for (const index of keyIndices) {
      if (pointsA[index] && pointsB[index]) {
        const dx = pointsA[index].x - pointsB[index].x;
        const dy = pointsA[index].y - pointsB[index].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        totalDistance += distance;
        validPoints++;
      }
    }

    if (validPoints === 0) return 0;

    // Normalizar a pontuação para 0-1, onde 1 é match perfeito
    const avgDistance = totalDistance / validPoints;
    const similarityScore = Math.max(0, 1 - avgDistance / 100);

    return similarityScore;
  } catch (error) {
    console.error("Erro ao comparar faces:", error);
    return 0;
  }
}

export default {
  runDetector,
  captureFrame,
  hasFace,
  compareFaces,
};
