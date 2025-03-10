import React, { useRef, useEffect, useState } from "react";
import CameraView from "../common/CameraView";
import useFaceDetection from "../../hooks/useFaceDetection";
import styles from "./styles.module.css";

interface FacialRecognitionProps {
  onComplete: (imageData: string) => void;
}

/**
 * Improved Facial Recognition Component
 * - Automatically captures face when properly detected
 * - Mobile-first responsive design
 * - Improved user experience and feedback
 */
const FacialRecognition: React.FC<FacialRecognitionProps> = ({
  onComplete,
}) => {
  // Referências para elementos DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estados locais
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureAttempts, setCaptureAttempts] = useState<number>(0);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [faceStableFor, setFaceStableFor] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showHelpTip, setShowHelpTip] = useState<boolean>(false);

  // Timer para atraso na exibição de dicas de ajuda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!capturedImage) {
        setShowHelpTip(true);
      }
    }, 10000); // Mostrar dica após 10 segundos sem captura

    return () => clearTimeout(timer);
  }, [capturedImage]);

  // Hook de detecção facial
  const {
    faceDetected,
    facePosition,
    startDetection,
    stopDetection,
    isProcessing,
  } = useFaceDetection();

  // Dimensões responsivas da câmera
  const getCameraDimensions = () => {
    const width = window.innerWidth < 480 ? window.innerWidth - 40 : 480;
    const height = (width * 3) / 4; // Proporção 4:3
    return { width, height };
  };

  const [cameraDimensions, setCameraDimensions] = useState(
    getCameraDimensions()
  );

  // Atualiza dimensões da câmera quando a janela é redimensionada
  useEffect(() => {
    const handleResize = () => {
      setCameraDimensions(getCameraDimensions());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Verifica se o rosto está bem posicionado para captura
  const isFaceWellPositioned = (): boolean => {
    if (!facePosition || !faceDetected) return false;

    // Calcular centro do rosto
    const faceCenterX = facePosition.x + facePosition.width / 2;
    const faceCenterY = facePosition.y + facePosition.height / 2;

    // Calcular centro da câmera
    const cameraWidth = cameraDimensions.width;
    const cameraHeight = cameraDimensions.height;
    const cameraHorizontalCenter = cameraWidth / 2;
    const cameraVerticalCenter = cameraHeight / 2;

    // Desvio do centro
    const horizontalDeviation =
      Math.abs(faceCenterX - cameraHorizontalCenter) / cameraWidth;
    const verticalDeviation =
      Math.abs(faceCenterY - cameraVerticalCenter) / cameraHeight;

    // Verificar tamanho do rosto
    const faceArea = facePosition.width * facePosition.height;
    const screenArea = cameraWidth * cameraHeight;
    const faceRatio = faceArea / screenArea;

    // Retorna true se todas as condições forem atendidas
    return (
      horizontalDeviation < 0.12 && // Menos de 12% de desvio horizontal
      verticalDeviation < 0.12 && // Menos de 12% de desvio vertical
      faceRatio > 0.08 && // Rosto ocupa pelo menos 8% da tela
      faceRatio < 0.65 // Rosto não ocupa mais de 65% da tela
    );
  };

  // Gerenciar a estabilidade do rosto para captura automática
  useEffect(() => {
    if (
      faceDetected &&
      isFaceWellPositioned() &&
      !capturedImage &&
      !isCapturing
    ) {
      setFaceStableFor((prev) => prev + 1);

      // Se o rosto estiver estável por tempo suficiente, inicia contagem regressiva
      if (faceStableFor > 15 && countdownValue === 0) {
        setCountdownValue(3);
      }
    } else {
      // Reseta contador se o rosto não estiver bem posicionado
      setFaceStableFor(0);

      // Cancela contagem se estiver em andamento
      if (countdownValue > 0 && !isCapturing) {
        setCountdownValue(0);
      }
    }
  }, [
    faceDetected,
    facePosition,
    capturedImage,
    isCapturing,
    countdownValue,
    faceStableFor,
  ]);

  // Gerencia a contagem regressiva
  useEffect(() => {
    if (countdownValue > 0) {
      const timer = setTimeout(() => {
        if (countdownValue === 1) {
          // Ao finalizar a contagem, captura a imagem automaticamente
          handleCapture();
        } else {
          // Decrementa o contador
          setCountdownValue(countdownValue - 1);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdownValue]);

  // Manipulador para quando o vídeo estiver carregado
  const handleVideoLoad = (video: HTMLVideoElement) => {
    if (!videoRef.current) {
      videoRef.current = video;

      // Inicia a detecção facial
      if (canvasRef.current) {
        startDetection(video, canvasRef.current);
      }
    }
  };

  // Captura uma imagem automaticamente
  const handleCapture = () => {
    if (!faceDetected || isCapturing) return;

    setIsCapturing(true);
    setTimeout(() => {
      if (videoRef.current) {
        // Incrementa as tentativas de captura
        setCaptureAttempts((prev) => prev + 1);

        // Cria um canvas temporário para capturar a imagem sem a malha facial
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cameraDimensions.width;
        tempCanvas.height = cameraDimensions.height;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx && videoRef.current) {
          // Desenha o vídeo no canvas temporário
          tempCtx.drawImage(
            videoRef.current,
            0,
            0,
            cameraDimensions.width,
            cameraDimensions.height
          );

          // Obtém a imagem do canvas
          const imageData = tempCanvas.toDataURL("image/jpeg", 0.9);
          setCapturedImage(imageData);

          // Após capturar, avança automaticamente após 1.5 segundos
          setTimeout(() => confirmCapture(imageData), 1500);
        }
      }
      setIsCapturing(false);
      setCountdownValue(0);
    }, 200);
  };

  // Confirma a captura atual e avança para o próximo passo
  const confirmCapture = (image: string) => {
    stopDetection();
    onComplete(image);
  };

  // Tenta uma nova captura
  const retryCapture = () => {
    setCapturedImage(null);
    setFaceStableFor(0);
    setCountdownValue(0);
  };

  // Limpa recursos ao desmontar o componente
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return (
    <div className={styles.facialRecognition}>
      <div className={styles.header}>
        <h2>Reconhecimento Facial</h2>
        <p>Posicione seu rosto no centro da tela</p>
      </div>

      <div
        className={styles.cameraContainer}
        style={{
          width: cameraDimensions.width,
          height: cameraDimensions.height,
        }}
      >
        {/* Componente de câmera */}
        <CameraView
          width={cameraDimensions.width}
          height={cameraDimensions.height}
          onVideoLoad={handleVideoLoad}
          showCaptureButton={false}
          showSwitchCameraButton={true}
          mirrored={true}
          facingMode="user"
        />

        {/* Canvas para renderização da malha facial */}
        <canvas
          ref={canvasRef}
          width={cameraDimensions.width}
          height={cameraDimensions.height}
          className={styles.canvas}
        />

        {/* Guias visuais para posicionamento */}
        {!capturedImage && faceDetected && (
          <div
            className={`${styles.faceGuide} ${
              isFaceWellPositioned() ? styles.wellPositioned : ""
            }`}
          />
        )}

        {/* Contagem regressiva para captura automática */}
        {countdownValue > 0 && (
          <div className={styles.countdown}>{countdownValue}</div>
        )}

        {/* Overlay para instruções e feedbacks */}
        <div className={styles.overlay}>
          {/* Status de inicialização */}
          {isProcessing && !faceDetected && !capturedImage && (
            <div className={styles.statusMessage}>
              <div className={styles.spinner}></div>
              <p>Procurando seu rosto...</p>
            </div>
          )}

          {/* Status quando o rosto não é detectado */}
          {!isProcessing && !faceDetected && !capturedImage && (
            <div className={styles.statusMessage}>
              <div className={styles.errorIcon}></div>
              <p>Rosto não detectado</p>
              <small>
                Certifique-se de que seu rosto está bem iluminado e visível
              </small>
            </div>
          )}

          {/* Instruções quando o rosto é detectado mas não está bem posicionado */}
          {faceDetected && !isFaceWellPositioned() && !capturedImage && (
            <div className={`${styles.positioningGuide} ${styles.active}`}>
              <p>Centralize seu rosto no círculo</p>
            </div>
          )}

          {/* Mensagem quando o rosto está posicionado corretamente */}
          {faceDetected &&
            isFaceWellPositioned() &&
            !capturedImage &&
            faceStableFor > 10 && (
              <div className={`${styles.positioningGuide} ${styles.success}`}>
                <p>Perfeito! Mantenha a posição</p>
              </div>
            )}
        </div>

        {/* Exibição da imagem capturada */}
        {capturedImage && (
          <div className={styles.capturePreview}>
            <img
              src={capturedImage}
              alt="Imagem capturada"
              width={cameraDimensions.width}
              height={cameraDimensions.height}
            />
            <div className={styles.captureSuccess}>
              <div className={styles.checkIcon}></div>
              <p>Captura realizada com sucesso!</p>
            </div>
          </div>
        )}
      </div>

      {/* Instruções e dicas */}
      <div className={styles.instructions}>
        <h4>Dicas para uma boa captura:</h4>
        <ul>
          <li>Ambiente bem iluminado</li>
          <li>Olhe diretamente para a câmera</li>
          <li>Mantenha expressão neutra</li>
          <li>Não use óculos escuros ou chapéus</li>
        </ul>

        {showHelpTip && captureAttempts === 0 && !capturedImage && (
          <div className={styles.helpTip}>
            <p>Não estamos conseguindo detectar seu rosto?</p>
            <small>
              Tente em um ambiente mais iluminado ou posicione-se em um fundo
              neutro.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialRecognition;
