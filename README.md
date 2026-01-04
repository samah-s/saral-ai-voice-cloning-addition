# SARAL AI  
**Simplified And Automated Research Amplification and Learning**

SARAL AI is a full-stack application that automates the process of converting research papers (LaTeX or arXiv) into professional educational videos. The system leverages AI for script generation, slide creation, audio narration, and video synthesis, enabling seamless research dissemination from paper upload to downloadable media.

This repository documents SARAL AI along with an **additional voice cloning feature** integrated into the existing audio narration pipeline.

---

## Overview

SARAL AI transforms research papers into video presentations through the following workflow:

1. Paper ingestion via arXiv or LaTeX ZIP
2. AI-driven script generation
3. Slide creation and image assignment
4. Audio narration generation
5. Video synthesis and export

The system is designed to support researchers in communicating complex ideas clearly and accessibly.

---

## Added Feature: Author Voice Cloning for Narration

### Feature Description

An **author voice cloning option** has been added to the audio generation stage of SARAL AI.  
This enhancement enables narration to be generated **in the author’s own voice and first-person perspective**, instead of using a generic synthetic narrator.

The feature integrates with SARAL’s existing workflow and does not alter upstream functionality.


---

## Technical Summary of Voice Cloning Integration

### Model & Framework
- **TTS Engine:** Coqui TTS
- **Model:** XTTS-v2 (multilingual, single-sample voice cloning)
- **Inference:** Local (CPU / CUDA supported)

### Key Capabilities
- Voice cloning from a single short reference audio
- Section-wise narration generation
- Robust handling of long academic scripts
- Seamless compatibility with SARAL’s existing video pipeline

---

## Implementation Details



### Long-Form Text Handling
Since neural TTS models perform best on shorter inputs:
- Scripts are split into sentence-aware chunks (≈200–300 characters)
- Each chunk is synthesized independently
- Audio chunks are concatenated using FFmpeg

### Reliability
- Chunk-level failure isolation
- Automatic fallback handling
- Validation to ensure successful audio generation

---

## Key Files Involved

backend/app/services/
└── voice_cloning_service.py


This service acts as a **drop-in addition** for the original narration module and maintains API compatibility.

---

## System Requirements

### Backend
- Python 3.9+
- FFmpeg
- pdflatex / texlive
- poppler-utils
- 8GB RAM recommended

### Frontend
- Node.js 16+
- Modern web browser

> The XTTS model (~2GB) is downloaded automatically on first use.

---

## Usage (Voice Cloning Mode)

1. Provide a reference voice sample (`.wav`, 10–30 seconds recommended)
2. Upload paper (arXiv or LaTeX ZIP)
3. Generate scripts and slides as usual
4. Enable voice cloning narration
5. Generate video

Audio files are produced section-wise and merged automatically.

---

## Outputs

- Section-wise narration audio
- Fully synthesized research presentation video
- Slides and scripts for download

> Working screenshots and generated outputs are available for review.

---

## Development Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** FastAPI
- **Speech:** Coqui TTS (XTTS-v2)
- **Media:** FFmpeg
- **AI Services:** Google Gemini (script generation)

---

## License

This project follows the same license as the original SARAL AI repository.

---

## Acknowledgements

- SARAL AI core team
- Coqui TTS
- FastAPI
- FFmpeg
- Google Gemini API

---

## Note

This repository documents an **extension to SARAL AI**.  
All core ownership and credit for the SARAL AI project belong to its original authors and maintainers.
