# 🔒 Life Proof System

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white" alt="TensorFlow" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <br/>
  <strong>A modern, secure and user-friendly identity verification system</strong>
</div>

<br/>

## 🌟 Overview

Life Proof is an advanced identity verification system that combines facial recognition, liveness detection, and document capture to ensure user authenticity. Built with modern web technologies, it offers a seamless and secure verification process entirely in the user's browser.

## ✨ Features

- **🧑 Facial Recognition** - Captures and validates user's facial features for identity verification
- **👁️ Liveness Detection** - Ensures the user is a real person through interactive challenges
  - Blink detection
  - Smile detection
  - Head movement verification
- **📄 Document Capture** - Allows users to capture images of identity documents (front and back)
- **🔄 Complete Verification Flow** - Guides users through all steps of the verification process
- **🔒 Privacy-Focused** - All processing happens locally in the browser

## 🛠️ Technologies

- **React.js** - UI component library
- **TypeScript** - Type-safe JavaScript
- **TensorFlow.js** - Machine learning in the browser
- **MediaPipe Face Mesh** - Real-time facial landmark detection
- **React Webcam** - Camera integration
- **Vite** - Fast build tool and development server

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern browser with WebGL support
- Webcam access

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/DantonTomacheski/life-proof.git
   cd life-proof
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## 📋 Usage Tips

- **Lighting** - Ensure you're in a well-lit environment for optimal facial recognition
- **Positioning** - Center your face in the camera frame and maintain an appropriate distance
- **Documents** - When capturing documents, make sure they're fully visible and readable
- **Privacy** - All verifications are performed locally; no data is sent to external servers

## 📁 Project Structure

```
src/
├── components/
│   ├── common/
│   │   └── CameraView.tsx     # Reusable camera component
│   ├── DocumentCapture/       # Document scanning component
│   ├── FacialRecognition/     # Facial recognition component
│   ├── LivenessDetection/     # Liveness detection component
│   └── ProofOfLifeSystem.tsx  # Main system component
├── hooks/
│   ├── useFaceDetection.ts    # Face detection hook
│   └── useLivenessDetection.ts# Liveness detection hook
├── services/
│   └── faceDetection.ts       # Face detection service
├── utils/
│   ├── drawMesh.ts            # Utility for drawing facial mesh
│   └── triangulation.ts       # Facial triangulation data
└── App.tsx                    # Main application component
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests with improvements.

---

<div align="center">
  <p>Developed with ❤️ to ensure security and authenticity in digital processes.</p>
  <p>© 2024 Danton Tomacheski</p>
</div>
