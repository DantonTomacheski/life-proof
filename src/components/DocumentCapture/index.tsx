import React, { useState, useRef, useEffect } from "react";
import CameraView from "../common/CameraView";
import styles from "./styles.module.css";

interface DocumentCaptureProps {
  onComplete: (frontImage: string, backImage: string) => void;
}

/**
 * Componente para captura de documentos (frente e verso)
 */
const DocumentCapture: React.FC<DocumentCaptureProps> = ({ onComplete }) => {
  // Estados para armazenar as imagens capturadas
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  // Estado para controlar qual lado do documento está sendo capturado
  const [currentSide, setCurrentSide] = useState<"front" | "back">("front");

  // Estados para controle de orientação e feedback
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [captureAttempts, setCaptureAttempts] = useState<{
    front: number;
    back: number;
  }>({
    front: 0,
    back: 0,
  });

  // Referência para o vídeo
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Dimensões da câmera
  const cameraWidth = 640;
  const cameraHeight = 480;

  // Verifica a orientação do dispositivo
  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setIsLandscape(true);
      } else {
        setIsLandscape(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  // Verifica se o dispositivo tem flash
  useEffect(() => {
    const checkFlash = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          const capabilities = tracks[0].getCapabilities();
          // @ts-ignore - Alguns navegadores não tipam corretamente o torch
          setHasFlash(capabilities.torch || false);
        }

        // Libera a stream para não manter a câmera ativa
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.error("Erro ao verificar flash:", error);
        setHasFlash(false);
      }
    };

    checkFlash();
  }, []);

  // Manipulador para captura da frente do documento
  const handleFrontCapture = (imageData: string) => {
    setFrontImage(imageData);
    setCaptureAttempts((prev) => ({ ...prev, front: prev.front + 1 }));

    // Automaticamente muda para capturar o verso após a frente
    setCurrentSide("back");
  };

  // Manipulador para captura do verso do documento
  const handleBackCapture = (imageData: string) => {
    setBackImage(imageData);
    setCaptureAttempts((prev) => ({ ...prev, back: prev.back + 1 }));
  };

  // Manipulador para tentar novamente a captura da frente
  const retryFrontCapture = () => {
    setFrontImage(null);
    setCurrentSide("front");
  };

  // Manipulador para tentar novamente a captura do verso
  const retryBackCapture = () => {
    setBackImage(null);
    setCurrentSide("back");
  };

  // Confirma as capturas e chama o callback onComplete
  const confirmCaptures = () => {
    if (frontImage && backImage) {
      onComplete(frontImage, backImage);
    }
  };

  // Manipulador para quando o vídeo é carregado
  const handleVideoLoad = (video: HTMLVideoElement) => {
    videoRef.current = video;
  };

  // Renderiza o componente apropriado com base no estado atual
  const renderCurrentView = () => {
    // Se ambas as imagens já foram capturadas, mostra a tela de confirmação
    if (frontImage && backImage) {
      return (
        <div className={styles.confirmationView}>
          <div className={styles.capturedImages}>
            <div className={styles.documentPreview}>
              <h3>Frente do Documento</h3>
              <div className={styles.imageWrapper}>
                <img
                  src={frontImage}
                  alt="Frente do documento"
                  className={styles.documentImage}
                />
                <button
                  className={styles.retryButton}
                  onClick={retryFrontCapture}
                >
                  <span className={styles.retryIcon}></span>
                </button>
              </div>
            </div>

            <div className={styles.documentPreview}>
              <h3>Verso do Documento</h3>
              <div className={styles.imageWrapper}>
                <img
                  src={backImage}
                  alt="Verso do documento"
                  className={styles.documentImage}
                />
                <button
                  className={styles.retryButton}
                  onClick={retryBackCapture}
                >
                  <span className={styles.retryIcon}></span>
                </button>
              </div>
            </div>
          </div>

          <button className={styles.confirmButton} onClick={confirmCaptures}>
            Confirmar e Continuar
          </button>
        </div>
      );
    }

    // Se estiver capturando a frente do documento
    if (currentSide === "front") {
      return (
        <div className={styles.captureView}>
          <div className={styles.cameraContainer}>
            <CameraView
              width={cameraWidth}
              height={cameraHeight}
              onVideoLoad={handleVideoLoad}
              onCapture={handleFrontCapture}
              showCaptureButton={true}
              captureButtonText="Capturar Frente"
              facingMode="environment"
              showSwitchCameraButton={true}
              mirrored={false}
              showFlash={hasFlash}
            />

            {/* Guia de documento */}
            <div className={styles.documentGuide}>
              <div className={styles.cornerTL}></div>
              <div className={styles.cornerTR}></div>
              <div className={styles.cornerBL}></div>
              <div className={styles.cornerBR}></div>
            </div>

            {/* Dicas de orientação do dispositivo */}
            {!isLandscape && (
              <div className={styles.orientationTip}>
                <div className={styles.rotateIcon}></div>
                <p>Gire o dispositivo para melhor captura</p>
              </div>
            )}
          </div>

          <div className={styles.captureInstructions}>
            <h3>Captura da Frente do Documento</h3>
            <ul>
              <li>Posicione o documento dentro do quadro</li>
              <li>Certifique-se de que o documento está bem iluminado</li>
              <li>Evite reflexos e sombras</li>
              <li>Mantenha a câmera firme</li>
            </ul>
          </div>
        </div>
      );
    }

    // Se estiver capturando o verso do documento
    return (
      <div className={styles.captureView}>
        <div className={styles.cameraContainer}>
          <CameraView
            width={cameraWidth}
            height={cameraHeight}
            onVideoLoad={handleVideoLoad}
            onCapture={handleBackCapture}
            showCaptureButton={true}
            captureButtonText="Capturar Verso"
            facingMode="environment"
            showSwitchCameraButton={true}
            mirrored={false}
            showFlash={hasFlash}
          />

          {/* Guia de documento */}
          <div className={styles.documentGuide}>
            <div className={styles.cornerTL}></div>
            <div className={styles.cornerTR}></div>
            <div className={styles.cornerBL}></div>
            <div className={styles.cornerBR}></div>
          </div>

          {/* Dicas de orientação do dispositivo */}
          {!isLandscape && (
            <div className={styles.orientationTip}>
              <div className={styles.rotateIcon}></div>
              <p>Gire o dispositivo para melhor captura</p>
            </div>
          )}
        </div>

        <div className={styles.captureInstructions}>
          <h3>Captura do Verso do Documento</h3>
          <ul>
            <li>Posicione o documento dentro do quadro</li>
            <li>Certifique-se de que o documento está bem iluminado</li>
            <li>Evite reflexos e sombras</li>
            <li>Mantenha a câmera firme</li>
          </ul>

          {captureAttempts.back > 2 && (
            <div className={styles.helpTip}>
              <p>
                Dica: Se estiver com dificuldades, tente ajustar a iluminação ou
                usar um fundo escuro para aumentar o contraste.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.documentCapture}>
      <div className={styles.header}>
        <h2>Captura de Documento</h2>
        <p>Capture a frente e o verso do seu documento de identidade</p>
      </div>

      {/* Indicador de progresso */}
      <div className={styles.progressSteps}>
        <div
          className={`${styles.step} ${
            currentSide === "front" || frontImage ? styles.active : ""
          } ${frontImage ? styles.completed : ""}`}
        >
          <div className={styles.stepIndicator}>
            {frontImage ? (
              <span className={styles.checkmark}></span>
            ) : (
              <span>1</span>
            )}
          </div>
          <span className={styles.stepLabel}>Frente</span>
        </div>

        <div className={styles.stepConnector}></div>

        <div
          className={`${styles.step} ${
            currentSide === "back" || backImage ? styles.active : ""
          } ${backImage ? styles.completed : ""}`}
        >
          <div className={styles.stepIndicator}>
            {backImage ? (
              <span className={styles.checkmark}></span>
            ) : (
              <span>2</span>
            )}
          </div>
          <span className={styles.stepLabel}>Verso</span>
        </div>
      </div>

      {/* Renderiza a visualização atual */}
      {renderCurrentView()}
    </div>
  );
};

export default DocumentCapture;
