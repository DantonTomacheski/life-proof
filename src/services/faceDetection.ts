import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { drawMesh } from "../utils/drawMesh";

// Configurações otimizadas para maior performance
const DETECTOR_CONFIG = {
  runtime: "tfjs" as const,
  refineLandmarks: false, // Desativado para melhor performance
  maxFaces: 1,
  // Adicionados parâmetros para otimizar a detecção
  scoreThreshold: 0.5,
  iouThreshold: 0.3,
};

// Cache para o detector para evitar recarregá-lo
let detectorCache: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let modelLoading = false;

/**
 * Inicializa o detector facial com retry e timeout
 */
async function initializeDetector(): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  if (detectorCache) {
    return detectorCache;
  }

  if (modelLoading) {
    // Se já estiver carregando, aguarda um pouco e tenta novamente
    await new Promise((resolve) => setTimeout(resolve, 100));
    return initializeDetector();
  }

  try {
    modelLoading = true;
    console.log("Inicializando detector facial...");

    // Define um timeout para o carregamento do modelo
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout ao carregar modelo")), 15000);
    });

    // Promessa de carregamento do modelo
    const modelPromise = (async () => {
      // Força o backend WebGL para melhor performance
      await Promise.all([
        import("@tensorflow/tfjs-backend-webgl"),
        tf.setBackend("webgl"),
      ]);

      // Carregar o modelo MediaPipe FaceMesh
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      return faceLandmarksDetection.createDetector(model, DETECTOR_CONFIG);
    })();

    // Usa race para aplicar o timeout
    const detector = await Promise.race([modelPromise, timeoutPromise]);

    console.log("Detector facial inicializado com sucesso");
    detectorCache = detector;
    modelLoading = false;
    return detector;
  } catch (error) {
    console.error("Erro ao inicializar o detector facial:", error);
    modelLoading = false;

    // Se falhar, tenta uma configuração mais simples
    try {
      console.log("Tentando configuração alternativa...");
      const simpleConfig = {
        runtime: "tfjs" as const,
        refineLandmarks: false,
        maxFaces: 1,
      };

      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(
        model,
        simpleConfig
      );

      detectorCache = detector;
      return detector;
    } catch (fallbackError) {
      console.error("Falha na configuração alternativa:", fallbackError);
      throw new Error("Não foi possível inicializar o detector facial");
    }
  }
}

/**
 * Executa o detector facial no vídeo e desenha a malha facial no canvas
 * Retorna uma função para cancelar a detecção
 */
export async function runDetector(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  drawFaceMesh: boolean = true,
  onPrediction?: (prediction: faceLandmarksDetection.Face | null) => void
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

  // Inicializar o detector com retry
  let detector: faceLandmarksDetection.FaceLandmarksDetector;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      detector = await initializeDetector();
      break;
    } catch (error) {
      retryCount++;
      console.error(`Tentativa ${retryCount}/${maxRetries} falhou:`, error);

      if (retryCount >= maxRetries) {
        throw new Error(
          "Falha após múltiplas tentativas de inicializar o detector facial"
        );
      }

      // Espera antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  let isRunning = true;
  let frameSkip = 0; // Para limitar a taxa de processamento
  const frameSkipThreshold = 2; // Processa a cada 3 frames para melhor performance

  // Função para detectar rostos
  const detect = async () => {
    if (!isRunning) return;

    try {
      // Verificar se o vídeo está pronto
      if (video.readyState === 4) {
        frameSkip = (frameSkip + 1) % (frameSkipThreshold + 1);

        // Processa apenas alguns frames para melhorar performance
        if (frameSkip === 0) {
          // Estimar faces no vídeo
          const predictions = await detector.estimateFaces(video);

          // Limpar o canvas se for desenhar
          if (drawFaceMesh) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          // Processar as predições
          if (predictions.length > 0) {
            const prediction = predictions[0];

            // Desenhar a malha facial se solicitado
            if (drawFaceMesh) {
              drawMesh(prediction, ctx);
            }

            // Callback com a predição, se fornecido
            if (onPrediction) {
              onPrediction(prediction);
            }
          } else if (onPrediction) {
            // Se não encontrar face, passar null para o callback
            onPrediction(null);
          }
        }
      }

      // Continuar o loop de detecção
      if (isRunning) {
        requestAnimationFrame(detect);
      }
    } catch (error) {
      console.error("Erro na detecção facial:", error);

      // Tentar novamente após 500ms em caso de erro
      if (isRunning) {
        setTimeout(() => {
          detect();
        }, 500);
      }
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

export default {
  runDetector,
  hasFace,
  initializeDetector,
};
