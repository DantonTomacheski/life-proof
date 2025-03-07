import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import styles from "./CameraView.module.css";

/**
 * Propriedades do componente CameraView
 */
interface CameraViewProps {
  width: number;
  height: number;
  onVideoLoad?: (video: HTMLVideoElement) => void;
  onCapture?: (imageData: string) => void;
  showCaptureButton?: boolean;
  captureButtonText?: string;
  facingMode?: "user" | "environment";
  showSwitchCameraButton?: boolean;
  mirrored?: boolean;
  showFlash?: boolean;
}

/**
 * Componente de visualização da câmera para captura de imagens
 */
const CameraView: React.FC<CameraViewProps> = ({
  width,
  height,
  onVideoLoad,
  onCapture,
  showCaptureButton = true,
  captureButtonText = "Capturar",
  facingMode = "user",
  showSwitchCameraButton = false,
  mirrored = true,
  showFlash = false,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFacingMode, setCurrentFacingMode] = useState<
    "user" | "environment"
  >(facingMode);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Configuração de vídeo
  const videoConstraints = {
    width,
    height,
    facingMode: currentFacingMode,
  };

  // Verifica se o dispositivo tem múltiplas câmeras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (error) {
        console.error("Erro ao verificar câmeras:", error);
        setHasMultipleCameras(false);
      }
    };

    checkCameras();
  }, []);

  // Gerencia o flash da câmera (quando disponível)
  useEffect(() => {
    if (flashEnabled && showFlash) {
      const enableFlash = async () => {
        try {
          const stream = webcamRef.current?.stream;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            // @ts-expect-error - torch property is not officially typed
            await track.applyConstraints({ advanced: [{ torch: true }] });
          }
        } catch (error) {
          console.error("Erro ao ativar o flash:", error);
          setFlashEnabled(false);
        }
      };

      enableFlash();
    } else {
      const disableFlash = async () => {
        try {
          const stream = webcamRef.current?.stream;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            // @ts-expect-error - torch property is not officially typed
            await track.applyConstraints({ advanced: [{ torch: false }] });
          }
        } catch (error) {
          console.error("Erro ao desativar o flash:", error);
        }
      };

      disableFlash();
    }
  }, [flashEnabled, showFlash]);

  // Gerenciador do contador para captura automática
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      captureImage();
      setCountdown(null);
    }
  }, [countdown]);

  // Manipulador para quando o vídeo é carregado
  const handleVideoLoad = useCallback(() => {
    setIsLoading(false);

    const video = webcamRef.current?.video;
    if (video && video.readyState === 4 && onVideoLoad) {
      // readyState 4 = HAVE_ENOUGH_DATA
      onVideoLoad(video);
    }
  }, [onVideoLoad]);

  // Função para capturar a imagem
  const captureImage = useCallback(() => {
    if (webcamRef.current && canvasRef.current) {
      // Captura o frame atual da webcam
      const imageSrc = webcamRef.current.getScreenshot();

      if (imageSrc && onCapture) {
        // Reproduz um som de obturador da câmera
        const shutterSound = new Audio("/shutter.mp3");
        shutterSound
          .play()
          .catch((err) => console.log("Erro ao reproduzir som:", err));

        // Passa a imagem para o callback
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  // Função para iniciar a contagem regressiva
  const startCountdown = useCallback(() => {
    setCountdown(3);
  }, []);

  // Alternar entre câmeras frontais e traseiras
  const toggleCamera = useCallback(() => {
    setCurrentFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Alternar o flash
  const toggleFlash = useCallback(() => {
    setFlashEnabled((prev) => !prev);
  }, []);

  return (
    <div
      className={styles.cameraContainer}
      style={{ width, height: height + 80 }} // Adiciona espaço para os controles
    >
      {/* Câmera */}
      <Webcam
        audio={false}
        ref={webcamRef}
        videoConstraints={videoConstraints}
        screenshotFormat="image/jpeg"
        onLoadedMetadata={handleVideoLoad}
        onUserMedia={handleVideoLoad}
        mirrored={mirrored && currentFacingMode === "user"}
        className={styles.webcam}
        width={width}
        height={height}
      />

      {/* Canvas para processamento (se necessário) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: "none" }}
      />

      {/* Sobreposição de contagem regressiva */}
      {countdown !== null && (
        <div className={styles.countdown}>
          <span>{countdown}</span>
        </div>
      )}

      {/* Spinner de carregamento */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Iniciando câmera...</p>
        </div>
      )}

      {/* Controles da câmera */}
      <div className={styles.cameraControls}>
        {showFlash && (
          <button
            className={`${styles.controlButton} ${
              flashEnabled ? styles.active : ""
            }`}
            onClick={toggleFlash}
            title="Flash"
          >
            <span className={styles.flashIcon}></span>
          </button>
        )}

        {showCaptureButton && (
          <button
            className={styles.captureButton}
            onClick={startCountdown}
            disabled={isLoading}
          >
            <span className={styles.captureIcon}></span>
            <span className={styles.captureText}>{captureButtonText}</span>
          </button>
        )}

        {showSwitchCameraButton && hasMultipleCameras && (
          <button
            className={styles.controlButton}
            onClick={toggleCamera}
            title="Alternar câmera"
          >
            <span className={styles.switchCameraIcon}></span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraView;
