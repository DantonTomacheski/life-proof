import React, { useRef, useEffect, useState } from "react";
import CameraView from "../common/CameraView";
import useFaceDetection from "../../hooks/useFaceDetection";
import styles from "./styles.module.css";

interface FacialRecognitionProps {
  onComplete: (imageData: string) => void;
}

/**
 * Componente para reconhecimento facial
 * Captura uma imagem do rosto do usuário quando detectado corretamente
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
  const [isCaptureReady, setIsCaptureReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(0);

  // Dimensões da câmera
  const cameraWidth = 640;
  const cameraHeight = 480;

  // Hook de detecção facial
  const {
    faceDetected,
    facePosition,
    startDetection,
    stopDetection,
    isProcessing,
  } = useFaceDetection();

  // Verifica se o rosto está bem posicionado para captura
  const isFaceWellPositioned = (): boolean => {
    if (!facePosition || !faceDetected) return false;

    // Verifica se o rosto está centralizado e com tamanho adequado
    const faceCenterX = facePosition.x + facePosition.width / 2;
    const faceCenterY = facePosition.y + facePosition.height / 2;

    const cameraHorizontalCenter = cameraWidth / 2;
    const cameraVerticalCenter = cameraHeight / 2;

    // Calcula o desvio do centro
    const horizontalDeviation =
      Math.abs(faceCenterX - cameraHorizontalCenter) / cameraWidth;
    const verticalDeviation =
      Math.abs(faceCenterY - cameraVerticalCenter) / cameraHeight;

    // Verifica se o tamanho do rosto é adequado (nem muito grande nem muito pequeno)
    const faceArea = facePosition.width * facePosition.height;
    const screenArea = cameraWidth * cameraHeight;
    const faceRatio = faceArea / screenArea;

    // Retorna true se todas as condições forem atendidas
    return (
      horizontalDeviation < 0.15 && // Menos de 15% de desvio horizontal
      verticalDeviation < 0.15 && // Menos de 15% de desvio vertical
      faceRatio > 0.1 && // Rosto ocupa pelo menos 10% da tela
      faceRatio < 0.6 // Rosto não ocupa mais de 60% da tela
    );
  };

  // Inicia a contagem regressiva para captura automática
  useEffect(() => {
    if (
      faceDetected &&
      isFaceWellPositioned() &&
      !capturedImage &&
      !isCapturing
    ) {
      // Quando o rosto estiver bem posicionado, ativa o estado de pronto para captura
      if (!isCaptureReady) {
        setIsCaptureReady(true);
      }

      // Se já estiver pronto, inicia a contagem regressiva
      if (isCaptureReady && countdownValue === 0) {
        setCountdownValue(3);
      }
    } else {
      // Se o rosto não estiver bem posicionado, reinicia o estado
      if (isCaptureReady && countdownValue === 0) {
        setIsCaptureReady(false);
      }

      // Se estiver no meio da contagem e o rosto sair da posição, cancela
      if (countdownValue > 0) {
        setCountdownValue(0);
      }
    }
  }, [
    faceDetected,
    facePosition,
    capturedImage,
    isCapturing,
    isCaptureReady,
    countdownValue,
  ]);

  // Gerencia a contagem regressiva
  useEffect(() => {
    if (countdownValue > 0) {
      const timer = setTimeout(() => {
        if (countdownValue === 1) {
          // Ao finalizar a contagem, captura a imagem
          handleCaptureClick();
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

  // Captura uma imagem quando o botão é clicado
  const handleCaptureClick = () => {
    if (!faceDetected || isCapturing) return;

    setIsCapturing(true);
    setTimeout(() => {
      if (videoRef.current) {
        // Incrementa as tentativas de captura
        setCaptureAttempts((prev) => prev + 1);

        // Cria um canvas temporário para capturar a imagem sem a malha facial
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cameraWidth;
        tempCanvas.height = cameraHeight;
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx && videoRef.current) {
          // Desenha o vídeo no canvas temporário
          tempCtx.drawImage(videoRef.current, 0, 0, cameraWidth, cameraHeight);

          // Obtém a imagem do canvas
          const imageData = tempCanvas.toDataURL("image/jpeg", 0.8);
          setCapturedImage(imageData);
        }
      }
      setIsCapturing(false);
      setCountdownValue(0);
    }, 200);
  };

  // Confirma a captura atual
  const confirmCapture = () => {
    if (capturedImage) {
      stopDetection();
      onComplete(capturedImage);
    }
  };

  // Tenta uma nova captura
  const retryCapture = () => {
    setCapturedImage(null);
    setIsCaptureReady(false);
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
        <p>Posicione seu rosto corretamente para a captura</p>
      </div>

      <div className={styles.cameraContainer}>
        {/* Componente de câmera */}
        <CameraView
          width={cameraWidth}
          height={cameraHeight}
          onVideoLoad={handleVideoLoad}
          showCaptureButton={false}
          showSwitchCameraButton={true}
          mirrored={true}
          facingMode="user"
        />

        {/* Canvas para renderização da malha facial */}
        <canvas
          ref={canvasRef}
          width={cameraWidth}
          height={cameraHeight}
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
                Certifique-se de que seu rosto está bem iluminado e visível na
                câmera
              </small>
            </div>
          )}

          {/* Instruções quando o rosto é detectado mas não está bem posicionado */}
          {faceDetected && !isFaceWellPositioned() && !capturedImage && (
            <div className={`${styles.positioningGuide} ${styles.active}`}>
              <p>Centralize seu rosto no quadro</p>
            </div>
          )}
        </div>

        {/* Exibição da imagem capturada */}
        {capturedImage && (
          <div className={styles.capturePreview}>
            <img
              src={capturedImage}
              alt="Imagem capturada"
              width={cameraWidth}
              height={cameraHeight}
            />
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className={styles.actionButtons}>
        {!capturedImage ? (
          <button
            className={`${styles.captureButton} ${
              !faceDetected || isCapturing ? styles.disabled : ""
            }`}
            onClick={handleCaptureClick}
            disabled={!faceDetected || isCapturing}
          >
            <span className={styles.captureButtonIcon}></span>
            Capturar Foto
          </button>
        ) : (
          <div className={styles.captureActions}>
            <button className={styles.retryButton} onClick={retryCapture}>
              Tentar Novamente
            </button>
            <button className={styles.confirmButton} onClick={confirmCapture}>
              Confirmar
            </button>
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

        {captureAttempts > 2 && !capturedImage && (
          <div className={styles.helpTip}>
            <p>Está tendo dificuldades?</p>
            <small>
              Tente ajustar a iluminação ou posicionar-se em um fundo neutro.
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialRecognition;
