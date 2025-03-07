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
  checkFaceMovement: (keypoints: FacePoint[]) => void;
  isProcessingChallenge: boolean;
}

/**
 * Hook para detecção de vivacidade
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
  const requiredDetections = 3; // Número de detecções consecutivas necessárias
  const movementThreshold = 0.3; // Limiar para detectar movimento

  // Índices de pontos faciais importantes (baseados no MediaPipe Face Mesh)
  const FACE_INDICES = {
    // Olhos
    leftEye: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
      246,
    ],
    rightEye: [
      362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
      398,
    ],

    // Boca
    mouth: [
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17,
      84, 181,
    ],

    // Nariz e queixo para rotação
    nose: [1, 2, 3, 4, 5, 6, 168, 197, 195, 5],
    chin: [199, 200, 201, 202, 204, 208, 210, 211, 212],

    // Contorno do rosto
    faceOval: [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
      378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
      162, 21, 54, 103, 67, 109,
    ],
  };

  // Limpa o intervalo de progresso do desafio
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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

      // Iniciar um timer para incrementar o progresso animado
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
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

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
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

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, []);

  // Calcula a distância entre dois pontos
  const distance = useCallback((p1: FacePoint, p2: FacePoint): number => {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        (p1.z && p2.z ? Math.pow(p2.z - p1.z, 2) : 0)
    );
  }, []);

  // Calcula a área de um polígono formado por pontos
  const calculateArea = useCallback((points: FacePoint[]): number => {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }, []);

  // Calcula o ângulo entre três pontos
  const calculateAngle = useCallback(
    (p1: FacePoint, p2: FacePoint, p3: FacePoint): number => {
      const vector1 = { x: p1.x - p2.x, y: p1.y - p2.y };
      const vector2 = { x: p3.x - p2.x, y: p3.y - p2.y };

      const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
      const magnitude1 = Math.sqrt(
        vector1.x * vector1.x + vector1.y * vector1.y
      );
      const magnitude2 = Math.sqrt(
        vector2.x * vector2.x + vector2.y * vector2.y
      );

      if (magnitude1 === 0 || magnitude2 === 0) return 0;

      const cosAngle = dotProduct / (magnitude1 * magnitude2);
      return Math.acos(Math.min(Math.max(cosAngle, -1), 1)) * (180 / Math.PI);
    },
    []
  );

  // Verifica se os olhos estão fechados
  const areEyesClosed = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (!keypoints || keypoints.length < 468) return false;

      // Calcula a abertura vertical dos olhos
      const getEyeOpenRatio = (eyeIndices: number[]) => {
        const eyePoints = eyeIndices.map((index) => keypoints[index]);
        const topPoints = eyePoints.slice(0, eyePoints.length / 2);
        const bottomPoints = eyePoints.slice(eyePoints.length / 2);

        // Calcula distâncias verticais entre os pontos superiores e inferiores
        let totalVerticalDistance = 0;
        const pairsToCheck = Math.min(topPoints.length, bottomPoints.length);

        for (let i = 0; i < pairsToCheck; i++) {
          totalVerticalDistance += distance(topPoints[i], bottomPoints[i]);
        }

        // Calcula a largura horizontal do olho
        const leftMostPoint = eyePoints.reduce(
          (prev, curr) => (prev.x < curr.x ? prev : curr),
          eyePoints[0]
        );
        const rightMostPoint = eyePoints.reduce(
          (prev, curr) => (prev.x > curr.x ? prev : curr),
          eyePoints[0]
        );

        const horizontalDistance = distance(leftMostPoint, rightMostPoint);

        // Retorna a proporção: quanto menor, mais fechado está o olho
        return totalVerticalDistance / (horizontalDistance * pairsToCheck);
      };

      const leftEyeRatio = getEyeOpenRatio(FACE_INDICES.leftEye);
      const rightEyeRatio = getEyeOpenRatio(FACE_INDICES.rightEye);

      // Média das proporções
      const averageRatio = (leftEyeRatio + rightEyeRatio) / 2;

      // Se a proporção for menor que um limiar, consideramos os olhos fechados
      return averageRatio < 0.04;
    },
    [distance]
  );

  // Verifica se há um sorriso
  const isSmiling = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (!keypoints || keypoints.length < 468) return false;

      // Pontos da boca
      const mouthPoints = FACE_INDICES.mouth.map((index) => keypoints[index]);

      // Calcular pontos extremos da boca
      const leftMostPoint = mouthPoints.reduce(
        (prev, curr) => (prev.x < curr.x ? prev : curr),
        mouthPoints[0]
      );
      const rightMostPoint = mouthPoints.reduce(
        (prev, curr) => (prev.x > curr.x ? prev : curr),
        mouthPoints[0]
      );
      const topMostPoint = mouthPoints.reduce(
        (prev, curr) => (prev.y < curr.y ? prev : curr),
        mouthPoints[0]
      );
      const bottomMostPoint = mouthPoints.reduce(
        (prev, curr) => (prev.y > curr.y ? prev : curr),
        mouthPoints[0]
      );

      // Calcular largura e altura da boca
      const mouthWidth = distance(leftMostPoint, rightMostPoint);
      const mouthHeight = distance(topMostPoint, bottomMostPoint);

      // Calcular área da boca
      const mouthArea = calculateArea(mouthPoints);

      // Proporção de largura/altura e área
      // Um sorriso tende a ter uma largura maior que a altura e uma área maior
      const widthHeightRatio = mouthWidth / mouthHeight;

      // Verificar se a pessoa está sorrindo
      return widthHeightRatio > 2.0 && mouthArea > 100;
    },
    [distance, calculateArea]
  );

  // Verifica se a cabeça está virada para a esquerda
  const isTurnedLeft = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (!keypoints || keypoints.length < 468) return false;

      // Pontos do contorno facial
      const faceOvalPoints = FACE_INDICES.faceOval.map(
        (index) => keypoints[index]
      );

      // Separar pontos do lado esquerdo e direito do rosto
      const leftSidePoints = faceOvalPoints.filter(
        (_, i) => i < faceOvalPoints.length / 2
      );
      const rightSidePoints = faceOvalPoints.filter(
        (_, i) => i >= faceOvalPoints.length / 2
      );

      // Calcular área visível de cada lado
      const leftSideArea = calculateArea(leftSidePoints);
      const rightSideArea = calculateArea(rightSidePoints);

      // Se o lado direito tem uma área significativamente maior que o lado esquerdo,
      // isso indica que a cabeça está virada para a esquerda
      const areaRatio = rightSideArea / (leftSideArea + 0.0001);

      return areaRatio > 1.4;
    },
    [calculateArea]
  );

  // Verifica se a cabeça está virada para a direita
  const isTurnedRight = useCallback(
    (keypoints: FacePoint[]): boolean => {
      if (!keypoints || keypoints.length < 468) return false;

      // Pontos do contorno facial
      const faceOvalPoints = FACE_INDICES.faceOval.map(
        (index) => keypoints[index]
      );

      // Separar pontos do lado esquerdo e direito do rosto
      const leftSidePoints = faceOvalPoints.filter(
        (_, i) => i < faceOvalPoints.length / 2
      );
      const rightSidePoints = faceOvalPoints.filter(
        (_, i) => i >= faceOvalPoints.length / 2
      );

      // Calcular área visível de cada lado
      const leftSideArea = calculateArea(leftSidePoints);
      const rightSideArea = calculateArea(rightSidePoints);

      // Se o lado esquerdo tem uma área significativamente maior que o lado direito,
      // isso indica que a cabeça está virada para a direita
      const areaRatio = leftSideArea / (rightSideArea + 0.0001);

      return areaRatio > 1.4;
    },
    [calculateArea]
  );

  // Verifica se a cabeça está acenando (movimento para cima e para baixo)
  const isNodding = useCallback((keypoints: FacePoint[]): boolean => {
    if (!keypoints || keypoints.length < 468 || !lastFaceStateRef.current)
      return false;

    // Pontos da ponta do nariz e do queixo
    const nosePoint = keypoints[1]; // Ponta do nariz
    const chinPoint = keypoints[199]; // Ponto central do queixo

    // Se não temos estado anterior, salvamos o atual
    if (!lastFaceStateRef.current.nosePoint) {
      lastFaceStateRef.current.nosePoint = nosePoint;
      lastFaceStateRef.current.chinPoint = chinPoint;
      return false;
    }

    // Calculamos o movimento vertical
    const noseMovementY = Math.abs(
      nosePoint.y - lastFaceStateRef.current.nosePoint.y
    );
    const chinMovementY = Math.abs(
      chinPoint.y - lastFaceStateRef.current.chinPoint.y
    );

    // Atualizamos o estado anterior
    lastFaceStateRef.current.nosePoint = nosePoint;
    lastFaceStateRef.current.chinPoint = chinPoint;

    // Verificamos se houve movimento vertical significativo
    const significantMovement =
      noseMovementY > movementThreshold || chinMovementY > movementThreshold;

    return significantMovement;
  }, []);

  // Verifica os movimentos faciais de acordo com o desafio atual
  const checkFaceMovement = useCallback(
    (keypoints: FacePoint[]): void => {
      if (!currentChallenge || !keypoints || keypoints.length < 468) return;

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
          consecutiveDetectionsRef.current - 0.5
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
    },
    [
      currentChallenge,
      completeChallenge,
      areEyesClosed,
      isSmiling,
      isTurnedLeft,
      isTurnedRight,
      isNodding,
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
