import React, { useRef, useEffect, useState } from "react";
import CameraView from "../common/CameraView";
import useFaceDetection from "../../hooks/useFaceDetection";
import {
  useLivenessDetection,
  LivenessChallenge,
} from "../../hooks/useLivenessDetection";
import styles from "./styles.module.css";

/**
 * Propriedades do componente de detecção de vivacidade
 */
interface LivenessDetectionProps {
  onComplete: () => void;
}

/**
 * Componente para detecção de vivacidade facial através de desafios
 * como piscar, sorrir e virar a cabeça.
 * - Versão melhorada com detecção automática
 * - Mobile-first design
 * - UX aprimorada
 */
const LivenessDetection: React.FC<LivenessDetectionProps> = ({
  onComplete,
}) => {
  // Referências para o canvas e vídeo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estados para controle da interface
  const [showChallengeSuccess, setShowChallengeSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [challengeStartTime, setChallengeStartTime] = useState<number | null>(
    null
  );
  const [showHelpTip, setShowHelpTip] = useState(false);

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

  // Lista de desafios
  const challenges: LivenessChallenge[] = [
    "blink",
    "smile",
    "turnLeft",
    "turnRight",
  ];

  // Hooks para detecção facial e de vivacidade
  const { faceDetected, startDetection, stopDetection, isProcessing } =
    useFaceDetection();

  const {
    currentChallenge,
    completedChallenges,
    allChallengesCompleted,
    challengeProgress,
    startChallenge,
    completeChallenge,
    resetChallenges,
    checkFaceMovement,
  } = useLivenessDetection(challenges);

  // Mostra dicas de ajuda se um desafio está demorando muito
  useEffect(() => {
    if (currentChallenge && challengeStartTime) {
      const timeSinceStart = Date.now() - challengeStartTime;

      // Se passaram mais de 10 segundos no mesmo desafio, mostra dica
      if (timeSinceStart > 10000 && !showHelpTip) {
        setShowHelpTip(true);
      }
    } else {
      setShowHelpTip(false);
    }
  }, [currentChallenge, challengeStartTime, showHelpTip]);

  // Inicia o próximo desafio
  const startNextChallenge = () => {
    const nextChallenge = challenges.find(
      (challenge) => !completedChallenges.includes(challenge)
    );

    if (nextChallenge) {
      startChallenge(nextChallenge);
      setChallengeStartTime(Date.now());
      setShowChallengeSuccess(false);
      setShowHelpTip(false);
    }
  };

  // Manipulador para quando o vídeo é carregado
  const handleVideoLoad = (video: HTMLVideoElement) => {
    videoRef.current = video;

    // Pequeno atraso para que as instruções sejam vistas
    setTimeout(() => {
      setShowInstructions(false);

      // Inicia a detecção facial
      if (canvasRef.current) {
        startDetection(video, canvasRef.current);

        // Inicia o primeiro desafio após um pequeno atraso
        setTimeout(() => {
          startNextChallenge();
        }, 1000);
      }
    }, 3000);
  };

  // Verifica o movimento facial periodicamente
  useEffect(() => {
    if (!faceDetected || !currentChallenge || showChallengeSuccess) return;

    const checkInterval = setInterval(() => {
      if (faceDetected) {
        // Simula pontos faciais para o desafio atual
        // Em uma implementação real, esses pontos viriam do TensorFlow
        const simulatedKeypoints = Array(468)
          .fill(null)
          .map((_, i) => ({
            x: Math.random() * cameraDimensions.width,
            y: Math.random() * cameraDimensions.height,
            z: Math.random() * 0.1,
          }));

        // Verifica o movimento facial para o desafio atual
        checkFaceMovement(simulatedKeypoints);

        // Se o progresso atingiu 100%, o desafio foi concluído
        if (challengeProgress === 100) {
          handleChallengeCompleted();
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [faceDetected, currentChallenge, challengeProgress, showChallengeSuccess]);

  // Manipulador para quando um desafio é concluído
  const handleChallengeCompleted = () => {
    if (currentChallenge) {
      completeChallenge(currentChallenge);
      setShowChallengeSuccess(true);

      // Atraso para mostrar a mensagem de sucesso antes de passar para o próximo desafio
      setTimeout(() => {
        startNextChallenge();
      }, 2000);
    }
  };

  // Monitora a conclusão de todos os desafios
  useEffect(() => {
    if (allChallengesCompleted) {
      stopDetection();
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [allChallengesCompleted, stopDetection, onComplete]);

  // Limpa a detecção quando o componente é desmontado
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Obtém o texto do desafio em português
  const getChallengeText = (challenge: LivenessChallenge): string => {
    switch (challenge) {
      case "blink":
        return "Pisque os olhos";
      case "smile":
        return "Sorria";
      case "turnLeft":
        return "Vire o rosto para a esquerda";
      case "turnRight":
        return "Vire o rosto para a direita";
      default:
        return "Aguarde...";
    }
  };

  // Obtém dicas específicas para cada desafio
  const getChallengeHelpTip = (challenge: LivenessChallenge): string => {
    switch (challenge) {
      case "blink":
        return "Tente piscar algumas vezes naturalmente, sem forçar muito";
      case "smile":
        return "Faça um sorriso mais pronunciado, mostrando os dentes";
      case "turnLeft":
        return "Vire a cabeça mais para a esquerda, até perder de vista a borda da tela";
      case "turnRight":
        return "Vire a cabeça mais para a direita, até perder de vista a borda da tela";
      default:
        return "Siga as instruções na tela";
    }
  };

  return (
    <div className={styles.livenessDetection}>
      <div className={styles.header}>
        <h2>Verificação de Vivacidade</h2>
        <p>Complete os desafios para confirmar que você é uma pessoa real</p>
      </div>

      {/* Barra de progresso dos desafios */}
      <div className={styles.challengesProgress}>
        {challenges.map((challenge, index) => (
          <div
            key={challenge}
            className={`${styles.challengeStep} ${
              completedChallenges.includes(challenge)
                ? styles.completed
                : currentChallenge === challenge
                ? styles.active
                : ""
            }`}
          >
            <div className={styles.stepIndicator}>
              {completedChallenges.includes(challenge) ? (
                <span className={styles.checkmark}></span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={styles.stepLabel}>
              {challenge === "blink"
                ? "Piscar"
                : challenge === "smile"
                ? "Sorrir"
                : challenge === "turnLeft"
                ? "Esquerda"
                : "Direita"}
            </span>
          </div>
        ))}
      </div>

      <div
        className={styles.cameraContainer}
        style={{
          width: cameraDimensions.width,
          height: cameraDimensions.height,
        }}
      >
        {/* Câmera */}
        <CameraView
          width={cameraDimensions.width}
          height={cameraDimensions.height}
          onVideoLoad={handleVideoLoad}
          showCaptureButton={false}
          mirrored={true}
          facingMode="user"
        />

        {/* Canvas para desenho da malha facial */}
        <canvas
          ref={canvasRef}
          width={cameraDimensions.width}
          height={cameraDimensions.height}
          className={styles.faceCanvas}
        />

        {/* Sobreposição de instruções iniciais */}
        {showInstructions && (
          <div className={styles.instructionsOverlay}>
            <div className={styles.instructionsContent}>
              <div className={styles.instructionIcon}></div>
              <h3>Vamos verificar se você é uma pessoa real</h3>
              <p>
                Posicione seu rosto no centro da câmera e siga as instruções.
              </p>
              <ul>
                <li>Certifique-se de estar em um ambiente bem iluminado</li>
                <li>Remova óculos escuros ou objetos que cubram seu rosto</li>
                <li>Olhe diretamente para a câmera</li>
              </ul>
            </div>
          </div>
        )}

        {/* Indicador de processamento e detecção */}
        {isProcessing && !faceDetected && !showInstructions && (
          <div className={styles.processingOverlay}>
            <div className={styles.spinner}></div>
            <p>Procurando seu rosto...</p>
          </div>
        )}

        {/* Marcador de face para orientação */}
        {faceDetected && currentChallenge && !allChallengesCompleted && (
          <div className={styles.faceGuide}>
            <div className={styles.faceOutline}></div>
          </div>
        )}

        {/* Indicador do desafio atual */}
        {currentChallenge &&
          !showChallengeSuccess &&
          !allChallengesCompleted && (
            <div className={styles.challengeIndicator}>
              <div
                className={styles.challengeIcon}
                data-challenge={currentChallenge}
              ></div>
              <p>{getChallengeText(currentChallenge)}</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${challengeProgress}%` }}
                ></div>
              </div>

              {/* Dica de ajuda se o usuário está tendo dificuldade */}
              {showHelpTip && (
                <div className={styles.challengeHelpTip}>
                  <small>{getChallengeHelpTip(currentChallenge)}</small>
                </div>
              )}
            </div>
          )}

        {/* Mensagem de sucesso do desafio */}
        {showChallengeSuccess && (
          <div className={`${styles.challengeResult} ${styles.success}`}>
            <div className={styles.successIcon}></div>
            <p>Desafio concluído!</p>
          </div>
        )}

        {/* Mensagem de conclusão de todos os desafios */}
        {allChallengesCompleted && (
          <div className={styles.completionOverlay}>
            <div className={styles.completionContent}>
              <div className={styles.successIcon}></div>
              <h3>Verificação Concluída</h3>
              <p>Todos os desafios foram concluídos com sucesso!</p>
            </div>
          </div>
        )}
      </div>

      {/* Dicas e instruções */}
      <div className={styles.helpSection}>
        <h3>Dicas para os desafios:</h3>
        <div className={styles.helpItems}>
          <div className={styles.helpItem}>
            <div className={`${styles.helpIcon} ${styles.iconBlink}`}></div>
            <div>
              <h4>Piscar</h4>
              <p>Pisque naturalmente algumas vezes olhando para a câmera</p>
            </div>
          </div>

          <div className={styles.helpItem}>
            <div className={`${styles.helpIcon} ${styles.iconSmile}`}></div>
            <div>
              <h4>Sorrir</h4>
              <p>Faça um sorriso natural olhando para a câmera</p>
            </div>
          </div>

          <div className={styles.helpItem}>
            <div className={`${styles.helpIcon} ${styles.iconTurn}`}></div>
            <div>
              <h4>Virar</h4>
              <p>Vire lentamente a cabeça para o lado indicado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivenessDetection;
