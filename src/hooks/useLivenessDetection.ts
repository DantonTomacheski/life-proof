// src/hooks/useLivenessDetection.ts
import { useState, useCallback, useRef, useEffect } from "react";

// Tipos de desafios possíveis
export type LivenessChallenge =
  | "blink"
  | "smile"
  | "turnLeft"
  | "turnRight"
  | "nod";

// Interface para o ponto facial
interface FacePoint {
  x: number;
  y: number;
  z?: number;
}

// Interface para o resultado da detecção de vivacidade
export interface UseLivenessDetectionResult {
  currentChallenge: LivenessChallenge | null;
  completedChallenges: LivenessChallenge[];
  allChallengesCompleted: boolean;
  challengeProgress: number;
  startChallenge: (challenge: LivenessChallenge) => void;
  completeChallenge: (challenge: LivenessChallenge) => void;
  resetChallenges: () => void;
  checkFaceMovement: (keypoints: FacePoint[]) => boolean;
  isProcessingChallenge: boolean;
}

/**
 * Hook para detecção de vivacidade com desafios faciais
 */
export const useLivenessDetection = (
  challengeList: LivenessChallenge[] = [
    "blink",
    "smile",
    "turnLeft",
    "turnRight",
  ]
): UseLivenessDetectionResult => {
  // Estados para controle dos desafios
  const [currentChallenge, setCurrentChallenge] =
    useState<LivenessChallenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<
    LivenessChallenge[]
  >([]);
  const [challengeProgress, setChallengeProgress] = useState<number>(0);
  const [allChallengesCompleted, setAllChallengesCompleted] =
    useState<boolean>(false);
  const [isProcessingChallenge, setIsProcessingChallenge] =
    useState<boolean>(false);

  // Referências para controle das detecções
  const consecutiveDetectionsRef = useRef<number>(0);
  const lastFaceStateRef = useRef<any>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const requiredDetections = 5; // Aumentado para tornar mais robusto
  const movementThreshold = 0.1; // Limiar para detectar movimento (reduzido para permitir detecção mais fácil)

  // Limpa o intervalo de progresso do desafio
  useEffect(() => {
    return () => {
      const intervalId = progressIntervalRef.current;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Inicia um desafio específico
  const startChallenge = useCallback(
    (challenge: LivenessChallenge) => {
      // Não inicia se o desafio já foi completado
      if (completedChallenges.includes(challenge)) {
        return;
      }

      setCurrentChallenge(challenge);
      setChallengeProgress(0);
      setIsProcessingChallenge(true);
      consecutiveDetectionsRef.current = 0;
      lastFaceStateRef.current = null;

      console.log(`Iniciando desafio: ${challenge}`);
    },
    [completedChallenges]
  );

  // Completa um desafio
  const completeChallenge = useCallback(
    (challenge: LivenessChallenge) => {
      // Verifica se o desafio já foi completado
      if (completedChallenges.includes(challenge)) {
        return;
      }

      // Adiciona o desafio à lista de completados
      const newCompletedChallenges = [...completedChallenges, challenge];
      setCompletedChallenges(newCompletedChallenges);
      setChallengeProgress(100);
      setCurrentChallenge(null);
      setIsProcessingChallenge(false);

      console.log(`Desafio completado: ${challenge}`);

      // Verifica se todos os desafios foram completados
      if (newCompletedChallenges.length === challengeList.length) {
        setAllChallengesCompleted(true);
        console.log("Todos os desafios foram completados!");
      }
    },
    [completedChallenges, challengeList]
  );

  // Reinicia todos os desafios
  const resetChallenges = useCallback(() => {
    setCompletedChallenges([]);
    setCurrentChallenge(null);
    setChallengeProgress(0);
    setAllChallengesCompleted(false);
    setIsProcessingChallenge(false);
    consecutiveDetectionsRef.current = 0;
    lastFaceStateRef.current = null;
  }, []);

  // Verifica se os olhos estão fechados
  // Simplificado para trabalhar com dados de posição aproximados
  const areEyesClosed = useCallback(
    (keypoints: FacePoint[]): boolean => {
      // Esta é uma implementação simplificada que verifica se os olhos estão fechados
      // baseada em pontos aproximados - para um sistema real você precisaria de pontos mais precisos

      // Verificamos se temos pontos suficientes para esta análise
      if (keypoints.length < 5) return false;

      // Em um modelo de detecção real, você teria pontos específicos para as pálpebras superior e inferior
      // Como estamos trabalhando com dados simplificados, simulamos a detecção de olhos fechados
      // com base na posição atual dos pontos faciais em relação ao estado anterior

      // Se não temos estado anterior, salvamos o atual e retornamos falso
      if (!lastFaceStateRef.current?.eyePoints) {
        lastFaceStateRef.current = {
          ...lastFaceStateRef.current,
          eyePoints: [keypoints[1], keypoints[2]], // Pontos referentes aos olhos (aproximados)
        };
        return false;
      }

      // Calculamos a diferença vertical dos pontos dos olhos
      // comparando com o estado anterior
      const leftEyeVerticalChange = Math.abs(
        keypoints[1].y - lastFaceStateRef.current.eyePoints[0].y
      );

      const rightEyeVerticalChange = Math.abs(
        keypoints[2].y - lastFaceStateRef.current.eyePoints[1].y
      );

      // Atualizamos o estado
      lastFaceStateRef.current.eyePoints = [keypoints[1], keypoints[2]];

      // Um piscar de olhos é detectado quando há uma mudança vertical pequena
      // e depois um retorno à posição original
      return (
        leftEyeVerticalChange > movementThreshold &&
        rightEyeVerticalChange > movementThreshold
      );
    },
    [movementThreshold]
  );

  // Verifica se há um sorriso
  // Simplificado para trabalhar com dados de posição aproximados
  const isSmiling = useCallback(
    (keypoints: FacePoint[]): boolean => {
      // Verificamos se temos pontos suficientes para esta análise
      if (keypoints.length < 5) return false;

      // Em um modelo real, teríamos pontos específicos para os cantos da boca
      // Aqui estamos usando uma aproximação baseada no movimento da boca (ponto 4)

      if (!lastFaceStateRef.current?.mouthPoints) {
        lastFaceStateRef.current = {
          ...lastFaceStateRef.current,
          mouthPoints: keypoints[4], // Ponto da boca (aproximado)
        };
        return false;
      }

      // Calculamos a diferença vertical e horizontal do ponto da boca
      const verticalChange =
        keypoints[4].y - lastFaceStateRef.current.mouthPoints.y;
      const horizontalChange = Math.abs(
        keypoints[4].x - lastFaceStateRef.current.mouthPoints.x
      );

      // Atualizamos o estado
      lastFaceStateRef.current.mouthPoints = keypoints[4];

      // Um sorriso geralmente envolve um movimento para cima dos cantos da boca
      // e um alargamento horizontal
      return (
        verticalChange < -movementThreshold &&
        horizontalChange > movementThreshold
      );
    },
    [movementThreshold]
  );

  // Verifica se a cabeça está virada para a esquerda
  const isTurnedLeft = useCallback((keypoints: FacePoint[]): boolean => {
    // Verificamos se temos pontos suficientes
    if (keypoints.length < 5) return false;

    // Para detectar a rotação da cabeça, podemos usar a posição relativa dos olhos e nariz
    // Quando a cabeça vira para a esquerda, o olho direito parece se mover mais para a esquerda
    const centralPoint = keypoints[0]; // Ponto central do rosto
    const leftEyePoint = keypoints[1]; // Olho esquerdo
    const rightEyePoint = keypoints[2]; // Olho direito
    const nosePoint = keypoints[3]; // Nariz

    // Calculamos a distância do nariz aos olhos
    const distanceToLeftEye = Math.abs(nosePoint.x - leftEyePoint.x);
    const distanceToRightEye = Math.abs(nosePoint.x - rightEyePoint.x);

    // Quando a cabeça vira para a esquerda, a distância entre o nariz e o olho direito
    // tende a ser menor que a distância entre o nariz e o olho esquerdo
    return distanceToRightEye < distanceToLeftEye * 0.7;
  }, []);

  // Verifica se a cabeça está virada para a direita
  const isTurnedRight = useCallback((keypoints: FacePoint[]): boolean => {
    // Verificamos se temos pontos suficientes
    if (keypoints.length < 5) return false;

    // Similar ao método anterior, mas para detectar rotação para a direita
    const centralPoint = keypoints[0]; // Ponto central do rosto
    const leftEyePoint = keypoints[1]; // Olho esquerdo
    const rightEyePoint = keypoints[2]; // Olho direito
    const nosePoint = keypoints[3]; // Nariz

    // Calculamos a distância do nariz aos olhos
    const distanceToLeftEye = Math.abs(nosePoint.x - leftEyePoint.x);
    const distanceToRightEye = Math.abs(nosePoint.x - rightEyePoint.x);

    // Quando a cabeça vira para a direita, a distância entre o nariz e o olho esquerdo
    // tende a ser menor que a distância entre o nariz e o olho direito
    return distanceToLeftEye < distanceToRightEye * 0.7;
  }, []);

  // Verifica se a cabeça está acenando (movimento para cima e para baixo)
  const isNodding = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (keypoints.length < 5 || !lastFaceStateRef.current?.nodPoints)
        return false;

      // Pontos para verificar o movimento vertical da cabeça
      const nosePoint = keypoints[3]; // Ponta do nariz

      // Se não temos estado anterior, salvamos o atual
      if (!lastFaceStateRef.current?.nodPoints) {
        lastFaceStateRef.current = {
          ...lastFaceStateRef.current,
          nodPoints: nosePoint,
        };
        return false;
      }

      // Calculamos o movimento vertical
      const verticalMovement = Math.abs(
        nosePoint.y - lastFaceStateRef.current.nodPoints.y
      );

      // Atualizamos o estado anterior
      lastFaceStateRef.current.nodPoints = nosePoint;

      // Verificamos se houve movimento vertical significativo
      return verticalMovement > movementThreshold;
    },
    [movementThreshold]
  );

  // Verifica os movimentos faciais de acordo com o desafio atual
  const checkFaceMovement = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (!currentChallenge || keypoints.length < 5) return false;

      // Inicializa lastFaceStateRef se necessário
      if (!lastFaceStateRef.current) {
        lastFaceStateRef.current = {};
      }

      let detected = false;

      // Verifica o tipo de desafio
      switch (currentChallenge) {
        case "blink":
          detected = areEyesClosed(keypoints);
          break;
        case "smile":
          detected = isSmiling(keypoints);
          break;
        case "turnLeft":
          detected = isTurnedLeft(keypoints);
          break;
        case "turnRight":
          detected = isTurnedRight(keypoints);
          break;
        case "nod":
          detected = isNodding(keypoints);
          break;
        default:
          break;
      }

      // Se detectado o movimento esperado, incrementa o contador
      if (detected) {
        consecutiveDetectionsRef.current += 1;
        console.log(
          `${currentChallenge} movement detected! Progress: ${consecutiveDetectionsRef.current}/${requiredDetections}`
        );

        // Atualiza o progresso do desafio
        const newProgress = Math.min(
          100,
          Math.floor(
            (consecutiveDetectionsRef.current / requiredDetections) * 100
          )
        );
        setChallengeProgress(newProgress);

        // Se atingir o número necessário de detecções, completa o desafio
        if (consecutiveDetectionsRef.current >= requiredDetections) {
          completeChallenge(currentChallenge);
        }
      } else {
        // Decrementa o contador, mas não abaixo de zero
        consecutiveDetectionsRef.current = Math.max(
          0,
          consecutiveDetectionsRef.current - 0.2
        );

        // Atualiza o progresso
        const newProgress = Math.min(
          100,
          Math.floor(
            (consecutiveDetectionsRef.current / requiredDetections) * 100
          )
        );
        setChallengeProgress(newProgress);
      }

      return detected;
    },
    [
      currentChallenge,
      completeChallenge,
      areEyesClosed,
      isSmiling,
      isTurnedLeft,
      isTurnedRight,
      isNodding,
      requiredDetections,
    ]
  );

  return {
    currentChallenge,
    completedChallenges,
    allChallengesCompleted,
    challengeProgress,
    startChallenge,
    completeChallenge,
    resetChallenges,
    checkFaceMovement,
    isProcessingChallenge,
  };
};

export default useLivenessDetection;
