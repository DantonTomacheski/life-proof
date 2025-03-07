import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";

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
  captureDelay?: number;
  showFlash?: boolean;
}

/**
 * Componente reutilizável para visualização de câmera
 */
const CameraView: React.FC<CameraViewProps> = ({
  width,
  height,
  onVideoLoad,
  onCapture,
  showCaptureButton = true,
  captureButtonText = "Capturar",
  facingMode: initialFacingMode = "user",
  showSwitchCameraButton = true,
  mirrored = true,
  captureDelay = 500,
  showFlash = true,
}) => {
  // Referência para o componente webcam
  const webcamRef = useRef<Webcam>(null);

  // Estados locais para controle da câmera
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    initialFacingMode
  );
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [hasCameraSupport, setHasCameraSupport] = useState<boolean>(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [showingFlash, setShowingFlash] = useState<boolean>(false);

  // Configuração da câmera
  const videoConstraints = {
    width,
    height,
    facingMode,
  };

  // Verifica suporte a múltiplas câmeras
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        setHasCameraSupport(videoDevices.length > 0);
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (error) {
        console.error("Erro ao verificar dispositivos de câmera:", error);
        setHasCameraSupport(false);
      }
    };

    checkCameraSupport();
  }, []);

  // Manipulador para quando o vídeo estiver pronto
  const handleVideoLoad = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video) return;

    const video = webcamRef.current.video;

    // Verifica se o vídeo está realmente pronto
    if (video.readyState === 4) {
      setIsLoading(false);
      setIsReady(true);

      if (onVideoLoad) {
        onVideoLoad(video);
      }
    }
  }, [onVideoLoad]);

  // Inicia a captura de uma imagem
  const captureImage = useCallback(() => {
    if (!webcamRef.current || !isReady) return;

    const flashEffect = () => {
      if (showFlash) {
        setShowingFlash(true);
        setTimeout(() => setShowingFlash(false), 150);
      }
    };

    setIsCapturing(true);
    flashEffect();

    // Pequeno atraso para melhor experiência do usuário
    setTimeout(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && onCapture) {
          onCapture(imageSrc);
        }
      }
      setIsCapturing(false);
    }, captureDelay);
  }, [isReady, onCapture, showFlash, captureDelay]);

  // Alterna entre câmera frontal e traseira
  const switchCamera = useCallback(() => {
    setFacingMode((prevFacingMode) =>
      prevFacingMode === "user" ? "environment" : "user"
    );
    setIsLoading(true);
    setIsReady(false);
  }, []);

  // Manipulador de teclas para captura com espaço ou enter
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        (e.code === "Space" || e.code === "Enter") &&
        showCaptureButton &&
        !isCapturing &&
        isReady
      ) {
        captureImage();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [captureImage, showCaptureButton, isCapturing, isReady]);

  return (
    <div
      className="camera-container"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        overflow: "hidden",
        borderRadius: "8px",
        backgroundColor: "#000",
      }}
    >
      {hasCameraSupport ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            width={width}
            height={height}
            onLoadedData={handleVideoLoad}
            mirrored={mirrored && facingMode === "user"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Overlay para indicação de carregamento */}
          {isLoading && (
            <div
              className="camera-overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 5,
              }}
            >
              <div className="camera-loading">
                <div
                  className="spinner"
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "50%",
                    borderTop: "3px solid white",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p>Carregando câmera...</p>
              </div>
            </div>
          )}

          {/* Efeito flash */}
          {showingFlash && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "white",
                opacity: 0.8,
                zIndex: 6,
              }}
            />
          )}

          {/* Moldura para posicionamento do rosto */}
          {isReady && !isCapturing && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "60%",
                height: "70%",
                border: "2px dashed rgba(255, 255, 255, 0.5)",
                borderRadius: "50%",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          )}

          {/* Botão de captura */}
          {showCaptureButton && isReady && (
            <button
              className="capture-button"
              onClick={captureImage}
              disabled={isCapturing}
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: isCapturing ? "#999" : "#3498db",
                color: "white",
                border: "none",
                borderRadius: "30px",
                padding: "12px 25px",
                fontSize: "1rem",
                cursor: isCapturing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                zIndex: 4,
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="12" cy="12" r="6" fill="white" />
              </svg>
              {captureButtonText}
            </button>
          )}

          {/* Botão para trocar câmera */}
          {showSwitchCameraButton && hasMultipleCameras && isReady && (
            <button
              onClick={switchCamera}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                zIndex: 4,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 16H15V10H19L12 3L5 10H9V16Z" fill="white" />
                <path d="M15 8H9V14H5L12 21L19 14H15V8Z" fill="white" />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            color: "#e74c3c",
            textAlign: "center",
          }}
        >
          <svg
            width="50"
            height="50"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#e74c3c"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="8"
              y1="8"
              x2="16"
              y2="16"
              stroke="#e74c3c"
              strokeWidth="2"
            />
            <line
              x1="16"
              y1="8"
              x2="8"
              y2="16"
              stroke="#e74c3c"
              strokeWidth="2"
            />
          </svg>
          <h3 style={{ marginTop: "15px" }}>Câmera não disponível</h3>
          <p>
            Não foi possível acessar sua câmera. Verifique as permissões do
            navegador e tente novamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraView;
