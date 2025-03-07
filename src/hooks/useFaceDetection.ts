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
 * Hook personalizado para detecção facial
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
  const consecutiveDetectionsRef = useRef<number>(0);
  const consecutiveNonDetectionsRef = useRef<number>(0);
  const detectionThreshold = 3; // Número de detecções consecutivas necessárias

  // Função para verificar a presença de pixels não transparentes no canvas
  const hasNonTransparentPixels = useCallback(
    (canvas: HTMLCanvasElement, minThreshold: number = 1000): boolean => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;
      let nonTransparentPixels = 0;

      for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] > 10) {
          // Alpha > 10 (não totalmente transparente)
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

  // Função para iniciar o processo de detecção
  const startDetection = useCallback(
    async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (isDetecting) return;

      setIsDetecting(true);
      setFaceDetected(false);
      setIsProcessing(true);
      setFacePosition(null);

      consecutiveDetectionsRef.current = 0;
      consecutiveNonDetectionsRef.current = 0;

      try {
        // Iniciar o detector facial
        await runDetector(video, canvas);

        // Iniciar loop de verificação para determinar se um rosto foi detectado
        const checkCanvas = () => {
          if (!isDetecting) return;

          const hasFace = hasNonTransparentPixels(canvas, 1000);

          if (hasFace) {
            consecutiveDetectionsRef.current += 1;
            consecutiveNonDetectionsRef.current = 0;

            // Após várias detecções consecutivas, consideramos que um rosto foi detectado
            if (
              consecutiveDetectionsRef.current >= detectionThreshold &&
              !faceDetected
            ) {
              console.log("Rosto detectado após detecções consecutivas");
              setFaceDetected(true);
              setIsProcessing(false);

              // Extrair informações da posição do rosto no canvas
              const ctx = canvas.getContext("2d");
              if (ctx) {
                const imageData = ctx.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );
                const data = imageData.data;

                // Encontrar limites do rosto (área não transparente)
                let minX = canvas.width;
                let minY = canvas.height;
                let maxX = 0;
                let maxY = 0;
                let foundPixels = false;

                for (let y = 0; y < canvas.height; y++) {
                  for (let x = 0; x < canvas.width; x++) {
                    const alpha = data[(y * canvas.width + x) * 4 + 3];
                    if (alpha > 10) {
                      minX = Math.min(minX, x);
                      minY = Math.min(minY, y);
                      maxX = Math.max(maxX, x);
                      maxY = Math.max(maxY, y);
                      foundPixels = true;
                    }
                  }
                }

                if (foundPixels) {
                  setFacePosition({
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                  });
                }
              }
            }
          } else {
            consecutiveNonDetectionsRef.current += 1;
            consecutiveDetectionsRef.current = 0;

            // Após várias não-detecções consecutivas, consideramos que o rosto foi perdido
            if (
              consecutiveNonDetectionsRef.current >= detectionThreshold &&
              faceDetected
            ) {
              console.log("Rosto perdido após não-detecções consecutivas");
              setFaceDetected(false);
              setFacePosition(null);
            }
          }

          // Continuar o loop de verificação
          detectorRef.current = requestAnimationFrame(checkCanvas);
        };

        // Iniciar o loop de verificação
        detectorRef.current = requestAnimationFrame(checkCanvas);
      } catch (error) {
        console.error("Erro ao iniciar a detecção facial:", error);
        setIsProcessing(false);
        setIsDetecting(false);
      }
    },
    [isDetecting, faceDetected, hasNonTransparentPixels]
  );

  // Função para interromper a detecção
  const stopDetection = useCallback(() => {
    if (detectorRef.current) {
      cancelAnimationFrame(detectorRef.current);
      detectorRef.current = null;
    }
    setIsDetecting(false);
    setIsProcessing(false);
  }, []);

  // Função para reiniciar a detecção
  const resetDetection = useCallback(() => {
    setFaceDetected(false);
    setFacePosition(null);
    consecutiveDetectionsRef.current = 0;
    consecutiveNonDetectionsRef.current = 0;
  }, []);

  // Limpar o loop de detecção ao desmontar o componente
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        cancelAnimationFrame(detectorRef.current);
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
