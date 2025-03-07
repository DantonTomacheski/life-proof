# Sistema de Prova de Vida (Life Proof)

Um sistema de verificação de identidade que utiliza reconhecimento facial, detecção de vivacidade e captura de documentos para garantir a autenticidade do usuário.

## Funcionalidades

- **Reconhecimento Facial**: Captura a imagem do rosto do usuário para verificação de identidade.
- **Detecção de Vivacidade**: Verifica se o usuário é uma pessoa real através de desafios como piscar, sorrir e virar a cabeça.
- **Captura de Documentos**: Permite capturar imagens da frente e verso de documentos de identidade.
- **Fluxo Completo**: Guia o usuário através de todas as etapas do processo de verificação.

## Tecnologias Utilizadas

- React.js
- TypeScript
- TensorFlow.js
- MediaPipe Face Mesh
- React Webcam

## Pré-requisitos

- Node.js (versão 14 ou superior)
- NPM ou Yarn

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/life-proof.git
   cd life-proof
   ```

2. Instale as dependências:

   ```bash
   npm install
   # ou
   yarn install
   ```

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   # ou
   yarn dev
   ```

4. Acesse a aplicação em seu navegador:
   ```
   http://localhost:5173
   ```

## Requisitos do Sistema

- Navegador moderno com suporte a WebGL (Chrome, Firefox, Safari, Edge)
- Câmera web funcional
- Permissões de acesso à câmera concedidas ao navegador
- Conexão à internet para carregar os modelos de IA

## Considerações de Uso

- **Iluminação**: Certifique-se de estar em um ambiente bem iluminado para melhor desempenho do reconhecimento facial.
- **Posicionamento**: Posicione seu rosto no centro da câmera e mantenha uma distância adequada.
- **Documentos**: Ao capturar documentos, certifique-se de que estão completamente visíveis e legíveis.
- **Privacidade**: Todas as verificações são realizadas localmente no navegador, sem envio de dados para servidores externos.

## Estrutura do Projeto

```
src/
├── components/
│   ├── common/
│   │   └── CameraView.tsx
│   ├── DocumentCapture/
│   │   └── index.tsx
│   ├── FacialRecognition/
│   │   └── index.tsx
│   ├── LivenessDetection/
│   │   └── index.tsx
│   └── ProofOfLifeSystem.tsx
├── hooks/
│   ├── useFaceDetection.ts
│   └── useLivenessDetection.ts
├── services/
│   └── faceDetection.ts
├── utils/
│   ├── drawMesh.ts
│   └── triangulation.ts
├── App.css
├── App.tsx
└── main.tsx
```

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests com melhorias.

---

Desenvolvido com ❤️ para garantir a segurança e autenticidade em processos digitais.
