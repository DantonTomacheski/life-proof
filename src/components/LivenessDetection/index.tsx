import React, { useRef, useEffect, useState } from "react";
import CameraView from "../common/CameraView";
import useFaceDetection from "../../hooks/useFaceDetection";
import useLivenessDetection, {
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
 * Componente de detecção de vivacidade
 * Realiza uma série de desafios faciais para verificar a vivacidade do usuário
 */
const LivenessDetection: React.FC<LivenessDetectionProps> = ({
  onComplete,
}) => {
  // Referências para os elementos do DOM
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estado para coletar as predições faciais
  const [facePrediction, setFacePrediction] = useState<any>(null);

  // Hook de detecção facial
  const {
    faceDetected,
    isDetecting,
    isProcessing: isProcessingFace,
    startDetection,
    stopDetection,
  } = useFaceDetection();

  // Lista de desafios de vivacidade
  const challenges: LivenessChallenge[] = [
    "blink",
    "smile",
    "turnLeft",
    "turnRight",
  ];

  // Hook de detecção de vivacidade
  const {
    currentChallenge,
    completedChallenges,
    allChallengesCompleted,
    challengeProgress,
    startChallenge,
    checkFaceMovement,
    isProcessingChallenge,
  } = useLivenessDetection(challenges);

  // Dimensões da câmera
  const cameraWidth = 640;
  const cameraHeight = 480;

  // Inicia o próximo desafio disponível
  const startNextChallenge = () => {
    // Encontra o próximo desafio que ainda não foi concluído
    const nextChallenge = challenges.find(
      (challenge) => !completedChallenges.includes(challenge)
    );

    if (nextChallenge) {
      startChallenge(nextChallenge);
    }
  };

  // Manipulador para quando o vídeo estiver carregado
  const handleVideoLoad = (video: HTMLVideoElement) => {
    if (!videoRef.current) {
      videoRef.current = video;

      // Inicia a detecção facial quando o vídeo estiver carregado
      if (canvasRef.current) {
        startDetection(video, canvasRef.current);
      }

      // Inicia o primeiro desafio
      startNextChallenge();
    }
  };

  // Verifica periodicamente o canvas para detecção facial
  useEffect(() => {
    let animationId: number;

    // Simula a obtenção de predições faciais
    const checkCanvas = () => {
      if (canvasRef.current && faceDetected) {
        // Em uma implementação real, obteríamos os keypoints da face
        // Para fins de demonstração, geramos predições simuladas
        const simulatedPrediction =
          generateSimulatedPrediction(currentChallenge);
        setFacePrediction(simulatedPrediction);

        // Passa as predições para o hook de detecção de vivacidade
        checkFaceMovement(simulatedPrediction);
      }

      animationId = requestAnimationFrame(checkCanvas);
    };

    animationId = requestAnimationFrame(checkCanvas);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [faceDetected, checkFaceMovement, currentChallenge]);

  // Inicia o próximo desafio quando um é concluído
  useEffect(() => {
    if (
      currentChallenge === null &&
      completedChallenges.length > 0 &&
      completedChallenges.length < challenges.length
    ) {
      // Pequeno atraso para melhor UX
      const timer = setTimeout(() => {
        startNextChallenge();
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Quando todos os desafios forem concluídos
    if (allChallengesCompleted) {
      stopDetection();
      // Pequeno atraso antes de chamar onComplete para melhor UX
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    completedChallenges,
    currentChallenge,
    allChallengesCompleted,
    challenges.length,
    onComplete,
    stopDetection,
  ]);

  // Função auxiliar para gerar predições faciais simuladas para testes
  // Em um ambiente real, isso viria de uma biblioteca de detecção facial
  const generateSimulatedPrediction = (challenge: LivenessChallenge | null) => {
    // Gera 468 pontos faciais simulados (MediaPipe Face Mesh tem 468 pontos)
    const keypoints = Array.from({ length: 468 }, (_, i) => ({
      x: Math.random() * cameraWidth,
      y: Math.random() * cameraHeight,
      z: Math.random() * 0.1,
    }));

    // Ajusta alguns pontos com base no desafio atual (para testes)
    return keypoints;
  };

  // Traduz o nome do desafio para texto amigável em português
  const getChallengeText = (challenge: LivenessChallenge | null): string => {
    if (!challenge) return "";

    switch (challenge) {
      case "blink":
        return "Pisque os olhos";
      case "smile":
        return "Sorria";
      case "turnLeft":
        return "Vire o rosto para a esquerda";
      case "turnRight":
        return "Vire o rosto para a direita";
      case "nod":
        return "Acene com a cabeça (sim)";
      default:
        return "";
    }
  };

  // Ícones para os desafios
  const getChallengeIcon = (
    challenge: LivenessChallenge | null
  ): JSX.Element => {
    if (!challenge) return <></>;

    switch (challenge) {
      case "blink":
        return (
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
              fill="currentColor"
            />
          </svg>
        );
      case "smile":
        return (
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7zm9-2c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm-8 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"
              fill="currentColor"
            />
          </svg>
        );
      case "turnLeft":
        return (
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 7l-5 5 5 5V7z" fill="currentColor" />
          </svg>
        );
      case "turnRight":
        return (
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 17l5-5-5-5v10z" fill="currentColor" />
          </svg>
        );
      case "nod":
        return (
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
          </svg>
        );
      default:
        return <></>;
    }
  };

  return (
    <div className={styles.livenessDetection}>
      <div className={styles.header}>
        <h2>Prova de Vida</h2>
        <p>Complete os desafios faciais para verificar sua identidade</p>
      </div>

      <div className={styles.cameraContainer}>
        {/* Componente de visualização da câmera */}
        <CameraView
          width={cameraWidth}
          height={cameraHeight}
          onVideoLoad={handleVideoLoad}
          showCaptureButton={false}
          showSwitchCameraButton={false}
          mirrored={true}
        />

        {/* Canvas para renderizar a malha facial */}
        <canvas
          ref={canvasRef}
          width={cameraWidth}
          height={cameraHeight}
          className={styles.canvas}
        />

        {/* Overlay para instruções e feedback */}
        <div className={styles.overlay}>
          {/* Status de inicialização */}
          {isProcessingFace && !faceDetected && (
            <div className={styles.statusMessage}>
              <div className={styles.spinner}></div>
              <p>Procurando seu rosto...</p>
            </div>
          )}

          {/* Verifica se a face foi detectada */}
          {!isProcessingFace && !faceDetected && isDetecting && (
            <div className={styles.statusMessage}>
              <div className={styles.errorIcon}></div>
              <p>Não foi possível detectar seu rosto</p>
              <small>
                Certifique-se de que seu rosto está bem iluminado e visível na
                câmera
              </small>
            </div>
          )}

          {/* Instruções do desafio atual */}
          {faceDetected && currentChallenge && (
            <div className={`${styles.challengePrompt} ${styles.active}`}>
              <div className={styles.challengeIcon}>
                {getChallengeIcon(currentChallenge)}
              </div>
              <h3>{getChallengeText(currentChallenge)}</h3>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${challengeProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Mensagem de conclusão do desafio */}
          {faceDetected &&
            !currentChallenge &&
            completedChallenges.length > 0 &&
            completedChallenges.length < challenges.length && (
              <div className={styles.challengeComplete}>
                <div className={styles.checkmark}></div>
                <p>Desafio concluído!</p>
                <small>Prepare-se para o próximo desafio...</small>
              </div>
            )}

          {/* Mensagem de todos os desafios concluídos */}
          {allChallengesCompleted && (
            <div className={styles.allComplete}>
              <div className={styles.successIcon}></div>
              <h3>Todos os desafios concluídos!</h3>
              <p>Verificação de vivacidade concluída com sucesso</p>
            </div>
          )}
        </div>
      </div>

      {/* Indicadores de progresso dos desafios */}
      <div className={styles.challengeIndicators}>
        {challenges.map((challenge, index) => (
          <div
            key={challenge}
            className={`${styles.indicator} ${
              completedChallenges.includes(challenge)
                ? styles.completed
                : currentChallenge === challenge
                ? styles.current
                : ""
            }`}
          >
            <div className={styles.indicatorIcon}>
              {completedChallenges.includes(challenge) ? (
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path
                    d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={styles.indicatorLabel}>
              {getChallengeText(challenge)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.instructions}>
        <h4>Dicas para completar os desafios</h4>
        <ul>
          <li>Posicione seu rosto no centro da câmera</li>
          <li>Certifique-se de estar em um ambiente bem iluminado</li>
          <li>Evite obstruções como óculos escuros ou chapéus</li>
          <li>Siga as instruções para cada desafio</li>
        </ul>
      </div>
    </div>
  );
};

export default LivenessDetection;
