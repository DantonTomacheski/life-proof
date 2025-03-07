import React, { useRef, useEffect, useState } from "react";
import CameraView from "../common/CameraView";
import { useFaceDetection } from "../../hooks/useFaceDetection";
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
 */
const LivenessDetection: React.FC<LivenessDetectionProps> = ({
  onComplete,
}) => {
  // Referências para o canvas e vídeo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estados para controle da interface
  const [facePrediction, setFacePrediction] = useState<any>(null);
  const [showChallengeSuccess, setShowChallengeSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Dimensões da câmera
  const cameraWidth = 640;
  const cameraHeight = 480;

  // Lista de desafios
  const challenges: LivenessChallenge[] = [
    "blink",
    "smile",
    "turnLeft",
    "turnRight",
  ];

  // Hooks para detecção facial e de vivacidade
  const { isDetecting, startDetection, stopDetection } = useFaceDetection();
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

  // Inicia o próximo desafio
  const startNextChallenge = () => {
    const nextChallenge = challenges.find(
      (challenge) => !completedChallenges.includes(challenge)
    );

    if (nextChallenge) {
      startChallenge(nextChallenge);
      setShowChallengeSuccess(false);
    }
  };

  // Manipulador para quando o vídeo é carregado
  const handleVideoLoad = (video: HTMLVideoElement) => {
    videoRef.current = video;
    setShowInstructions(false);
    startDetection(canvasRef);
    startNextChallenge(); // Inicia o primeiro desafio
  };

  // Função para verificar o canvas (simulando a obtenção de predições)
  const checkCanvas = () => {
    // Exemplo de predição - em um aplicativo real, isso viria do TensorFlow
    if (isDetecting && videoRef.current && currentChallenge) {
      // Simula uma detecção facial com pontos-chave básicos
      const simulatedPrediction = {
        keypoints: [
          { x: Math.random() * cameraWidth, y: Math.random() * cameraHeight },
          { x: Math.random() * cameraWidth, y: Math.random() * cameraHeight },
          // Mais pontos seriam incluídos em uma implementação real
        ],
      };

      setFacePrediction(simulatedPrediction);

      // Verifica o movimento facial para o desafio atual
      const result = checkFaceMovement(simulatedPrediction);

      // Se o progresso atingiu 100%, o desafio foi concluído
      if (result && challengeProgress === 100) {
        handleChallengeCompleted();
      }
    }
  };

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

  // Executa a verificação do canvas periodicamente
  useEffect(() => {
    const interval = setInterval(checkCanvas, 100);
    return () => clearInterval(interval);
  }, [isDetecting, currentChallenge, challengeProgress]);

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

      <div className={styles.cameraContainer}>
        {/* Câmera */}
        <CameraView
          width={cameraWidth}
          height={cameraHeight}
          onVideoLoad={handleVideoLoad}
          showCaptureButton={false}
        />

        {/* Canvas para desenho da malha facial */}
        <canvas
          ref={canvasRef}
          width={cameraWidth}
          height={cameraHeight}
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

        {/* Marcador de face para orientação */}
        {isDetecting && currentChallenge && !allChallengesCompleted && (
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
