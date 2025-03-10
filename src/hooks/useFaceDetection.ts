import { useState, useCallback, useRef, useEffect } from "react";
import { runDetector } from "../services/faceDetection";

/**
 * Interface para o retorno da função useFaceDetection
 */
interface UseFaceDetectionResult {
  isDetecting: boolean;
  faceDetected: boolean;
  facePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  startDetection: (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => Promise<void>;
  stopDetection: () => void;
  resetDetection: () => void;
  isProcessing: boolean;
}

/**
 * Hook personalizado aprimorado para detecção facial
 * - Melhoria na estabilidade da detecção
 * - Redução de falsos positivos/negativos
 * - Adaptado para melhor performance em dispositivos móveis
 */
export const useFaceDetection = (): UseFaceDetectionResult => {
  // Estados para controle de detecção facial
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [facePosition, setFacePosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Referências para controle do loop de detecção
  const detectorRef = useRef<number | null>(null);
  const cancelDetectionRef = useRef<(() => void) | null>(null);
  const consecutiveDetectionsRef = useRef<number>(0);
  const consecutiveNonDetectionsRef = useRef<number>(0);
  const detectionThreshold = 2; // Reduzido para melhorar a responsividade
  const nonDetectionThreshold = 3; // Aumentado para evitar oscilações

  // Cache de previsões para suavizar os resultados
  const predictionsCache = useRef<any[]>([]);
  const maxCacheSize = 3;

  // Função para verificar pixels não transparentes no canvas
  const hasNonTransparentPixels = useCallback(
    (canvas: HTMLCanvasElement, minThreshold: number = 800): boolean => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      let nonTransparentPixels = 0;

      // Amostragem para aumentar performance
      for (let i = 3; i < imageData.length; i += 16) {
        if (imageData[i] > 5) {
          // Alpha > 5 (não totalmente transparente)
          nonTransparentPixels++;
          if (nonTransparentPixels > minThreshold) {
            return true;
          }
        }
      }

      return false;
    },
    []
  );

  // Calcula a média das posições do rosto a partir do cache
  const calculateAveragePosition = useCallback(() => {
    if (predictionsCache.current.length === 0) return null;

    const validPositions = predictionsCache.current.filter(
      (pos) => pos !== null
    );
    if (validPositions.length === 0) return null;

    const sum = validPositions.reduce(
      (acc, pos) => {
        return {
          x: acc.x + pos.x,
          y: acc.y + pos.y,
          width: acc.width + pos.width,
          height: acc.height + pos.height,
        };
      },
      { x: 0, y: 0, width: 0, height: 0 }
    );

    return {
      x: sum.x / validPositions.length,
      y: sum.y / validPositions.length,
      width: sum.width / validPositions.length,
      height: sum.height / validPositions.length,
    };
  }, []);

  // Extrai os limites do rosto a partir dos dados do canvas
  const extractFaceBounds = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Encontrar limites do rosto (área não transparente)
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let foundPixels = false;

      // Usa amostragem para melhor performance
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 5) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            foundPixels = true;
          }
        }
      }

      if (foundPixels) {
        const position = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };

        // Adiciona a nova posição ao cache
        predictionsCache.current.push(position);

        // Limita o tamanho do cache
        if (predictionsCache.current.length > maxCacheSize) {
          predictionsCache.current.shift();
        }

        // Retorna posição suavizada
        return calculateAveragePosition();
      }

      return null;
    },
    [calculateAveragePosition]
  );

  // Função para iniciar o processo de detecção
  const startDetection = useCallback(
    async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (isDetecting) return;

      setIsDetecting(true);
      setFaceDetected(false);
      setIsProcessing(true);
      setFacePosition(null);

      // Limpa as referências
      consecutiveDetectionsRef.current = 0;
      consecutiveNonDetectionsRef.current = 0;
      predictionsCache.current = [];

      try {
        // Iniciar o detector facial - retorna função para cancelar
        const cancelDetection = await runDetector(video, canvas);
        cancelDetectionRef.current = cancelDetection;

        // Iniciar loop para verificar se um rosto foi detectado
        const checkFace = () => {
          if (!isDetecting) return;

          const hasFace = hasNonTransparentPixels(canvas, 800);

          if (hasFace) {
            consecutiveDetectionsRef.current += 1;
            consecutiveNonDetectionsRef.current = 0;

            // Após várias detecções consecutivas, consideramos que um rosto foi detectado
            if (
              consecutiveDetectionsRef.current >= detectionThreshold &&
              !faceDetected
            ) {
              console.log("Rosto detectado");
              setFaceDetected(true);
              setIsProcessing(false);

              // Extrair posição do rosto
              const position = extractFaceBounds(canvas);
              if (position) {
                setFacePosition(position);
              }
            } else if (faceDetected) {
              // Se já tem um rosto detectado, apenas atualiza a posição
              const position = extractFaceBounds(canvas);
              if (position) {
                setFacePosition(position);
              }
            }
          } else {
            consecutiveNonDetectionsRef.current += 1;

            // Se não detectar por várias vezes seguidas, consideramos que o rosto foi perdido
            if (
              consecutiveNonDetectionsRef.current >= nonDetectionThreshold &&
              faceDetected
            ) {
              console.log("Rosto perdido");
              setFaceDetected(false);
              setFacePosition(null);
              predictionsCache.current = [];
            }
          }

          // Continuar o loop de verificação
          detectorRef.current = requestAnimationFrame(checkFace);
        };

        // Iniciar o loop de verificação
        detectorRef.current = requestAnimationFrame(checkFace);
      } catch (error) {
        console.error("Erro ao iniciar a detecção facial:", error);
        setIsProcessing(false);
        setIsDetecting(false);
      }
    },
    [isDetecting, faceDetected, hasNonTransparentPixels, extractFaceBounds]
  );

  // Função para interromper a detecção
  const stopDetection = useCallback(() => {
    if (detectorRef.current) {
      cancelAnimationFrame(detectorRef.current);
      detectorRef.current = null;
    }

    if (cancelDetectionRef.current) {
      cancelDetectionRef.current();
      cancelDetectionRef.current = null;
    }

    setIsDetecting(false);
    setIsProcessing(false);
  }, []);

  // Função para reiniciar a detecção
  const resetDetection = useCallback(() => {
    setFaceDetected(false);
    setFacePosition(null);
    predictionsCache.current = [];
    consecutiveDetectionsRef.current = 0;
    consecutiveNonDetectionsRef.current = 0;
  }, []);

  // Limpar o loop de detecção ao desmontar o componente
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        cancelAnimationFrame(detectorRef.current);
      }

      if (cancelDetectionRef.current) {
        cancelDetectionRef.current();
      }
    };
  }, []);

  return {
    isDetecting,
    faceDetected,
    facePosition,
    startDetection,
    stopDetection,
    resetDetection,
    isProcessing,
  };
};

export default useFaceDetection;
