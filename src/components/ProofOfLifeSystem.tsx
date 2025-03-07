import React, { useState } from "react";
import FacialRecognition from "./FacialRecognition";
import LivenessDetection from "./LivenessDetection";
import DocumentCapture from "./DocumentCapture";

// Tipos de etapas do processo
type VerificationStep =
  | "facialRecognition"
  | "livenessDetection"
  | "documentCapture"
  | "completed";

/**
 * Componente principal que orquestra o fluxo de verificação
 */
const ProofOfLifeSystem: React.FC = () => {
  // Estado para controlar a etapa atual
  const [currentStep, setCurrentStep] =
    useState<VerificationStep>("facialRecognition");

  // Estado para armazenar os dados capturados
  const [verificationData, setVerificationData] = useState<{
    faceImage: string | null;
    documentFrontImage: string | null;
    documentBackImage: string | null;
  }>({
    faceImage: null,
    documentFrontImage: null,
    documentBackImage: null,
  });

  // Manipulador para conclusão do reconhecimento facial
  const handleFacialRecognitionComplete = (imageData: string) => {
    setVerificationData((prev) => ({ ...prev, faceImage: imageData }));
    setCurrentStep("livenessDetection");
  };

  // Manipulador para conclusão da verificação de vivacidade
  const handleLivenessDetectionComplete = () => {
    setCurrentStep("documentCapture");
  };

  // Manipulador para conclusão da captura de documento
  const handleDocumentCaptureComplete = (
    frontImage: string,
    backImage: string
  ) => {
    setVerificationData((prev) => ({
      ...prev,
      documentFrontImage: frontImage,
      documentBackImage: backImage,
    }));
    setCurrentStep("completed");
  };

  // Reinicia o processo
  const handleRestart = () => {
    setVerificationData({
      faceImage: null,
      documentFrontImage: null,
      documentBackImage: null,
    });
    setCurrentStep("facialRecognition");
  };

  // Renderiza a etapa atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "facialRecognition":
        return (
          <FacialRecognition onComplete={handleFacialRecognitionComplete} />
        );

      case "livenessDetection":
        return (
          <LivenessDetection onComplete={handleLivenessDetectionComplete} />
        );

      case "documentCapture":
        return <DocumentCapture onComplete={handleDocumentCaptureComplete} />;

      case "completed":
        return (
          <div
            className="verification-completed"
            style={{ textAlign: "center", padding: "30px" }}
          >
            <div
              style={{
                backgroundColor: "#2ecc71",
                color: "white",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "30px",
              }}
            >
              <h2 style={{ margin: "0 0 10px" }}>
                Verificação Concluída com Sucesso!
              </h2>
              <p style={{ fontSize: "1.1rem" }}>
                Todas as etapas foram concluídas com êxito.
              </p>
            </div>

            <div
              className="verification-summary"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              <div
                className="summary-section"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>Reconhecimento Facial</h3>
                {verificationData.faceImage && (
                  <img
                    src={verificationData.faceImage}
                    alt="Imagem facial"
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "5px",
                    }}
                  />
                )}
              </div>

              <div
                className="summary-section"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>Verificação de Vivacidade</h3>
                <p>
                  Todos os desafios de vivacidade foram concluídos com sucesso.
                </p>
              </div>

              <div
                className="summary-section"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                }}
              >
                <h3>Documento Capturado</h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                  }}
                >
                  {verificationData.documentFrontImage && (
                    <div>
                      <h4>Frente</h4>
                      <img
                        src={verificationData.documentFrontImage}
                        alt="Frente do documento"
                        style={{
                          width: "200px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                  )}

                  {verificationData.documentBackImage && (
                    <div>
                      <h4>Verso</h4>
                      <img
                        src={verificationData.documentBackImage}
                        alt="Verso do documento"
                        style={{
                          width: "200px",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "5px",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              style={{
                marginTop: "30px",
                padding: "10px 30px",
                backgroundColor: "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1.1rem",
              }}
            >
              Iniciar Novo Processo
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderiza o indicador de progresso
  const renderProgressIndicator = () => {
    const steps: { key: VerificationStep; label: string }[] = [
      { key: "facialRecognition", label: "Reconhecimento Facial" },
      { key: "livenessDetection", label: "Verificação de Vivacidade" },
      { key: "documentCapture", label: "Captura de Documento" },
      { key: "completed", label: "Concluído" },
    ];

    return (
      <div
        className="progress-indicator"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        {steps.map((step, index) => {
          // Determina se a etapa está ativa, concluída ou pendente
          const isActive = step.key === currentStep;
          const isCompleted =
            steps.findIndex((s) => s.key === currentStep) > index;

          // Determina a cor do indicador
          let backgroundColor = "#e0e0e0"; // Pendente
          if (isActive) backgroundColor = "#3498db"; // Ativo
          if (isCompleted) backgroundColor = "#2ecc71"; // Concluído

          return (
            <div
              key={step.key}
              style={{ display: "flex", alignItems: "center" }}
            >
              {/* Indicador de etapa */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: isActive || isCompleted ? "white" : "black",
                    fontWeight: "bold",
                  }}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "0.8rem",
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive
                      ? "#3498db"
                      : isCompleted
                      ? "#2ecc71"
                      : "#666",
                  }}
                >
                  {step.label}
                </div>
              </div>

              {/* Linha conectora (exceto para o último item) */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    height: "2px",
                    width: "50px",
                    backgroundColor: isCompleted ? "#2ecc71" : "#e0e0e0",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="proof-of-life-system" style={{ padding: "20px" }}>
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>Sistema de Verificação de Identidade</h1>
        <p>Siga as etapas para completar o processo de verificação</p>
      </header>

      {renderProgressIndicator()}

      <div className="verification-step-container">{renderCurrentStep()}</div>
    </div>
  );
};

export default ProofOfLifeSystem;
