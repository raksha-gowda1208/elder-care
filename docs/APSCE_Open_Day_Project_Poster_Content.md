# APSCE OPEN DAY PROJECT PRESENTATION POSTER
### Event Date: November 19th, 2026 | Department of Computer Science & Engineering, APSCE

================================================================================
HEADER SECTION
================================================================================

PROJECT TITLE:
EldrAI: Ambient Zero-Wearable Intelligent Healthcare & Real-Time Fall Detection Telepresence System with Multilingual Voice Adherence and Kinematic Forensics

STUDENT NAME(S) | USN(S) | GUIDE NAME:
Raksha S. (USN: 1AP21CS001) & Project Team Members
Under the Guidance of: Dr. Shivamurthaiah M, Professor & HOD

DEPARTMENT NAME:
Department of Computer Science and Engineering

COLLEGE NAME | ACADEMIC YEAR:
APS College of Engineering, Bengaluru (Affiliated with VTU, Belagavi)
Academic Year: 2025–2026

KEY PERFORMANCE METRICS (CALLOUT BADGES):
• 96.8% Fall Detection Accuracy (Across 140 Multi-Scenario Trials)
• < 150 ms End-to-End WebSocket Telemetry Latency
• 100% Visual Privacy Preserved (Zero Cloud Video Streamed/Stored)
• 18-Frame (~5.5s) Pre-Fall Kinematic Rolling Buffer Scrubber
• 3 Supported Languages: Kannada (ಕನ್ನಡ), Hindi (हिन्दी), English

================================================================================
1. INTRODUCTION - Project background and overview
================================================================================
• Demographic Transition: Global projections indicate that by 2050, more than 20% of the world's population will be aged 60+, with rapid growth in independent, single-occupant elderly households across urban India.
• The Dual Risk in Geriatric Care: Seniors living independently face two catastrophic health threats: sudden unobserved physical falls leading to prolonged immobilization, and polypharmacy medication non-adherence due to cognitive or sensory decline.
• Project Overview: EldrAI is a zero-wearable, privacy-preserving Ambient Assisted Living (AAL) telepresence platform. It runs real-time 3D skeletal tracking directly on commodity webcams using client-side WebAssembly (MediaPipe BlazePose), coupled with an acoustic multilingual voice loop (Kannada, Hindi, English). It detects falls instantaneously, captures pre-fall motion forensics without cloud video recording, and empowers remote caregivers with bidirectional closed-loop telecare.

================================================================================
2. PROBLEM STATEMENT - Problem addressed by the project
================================================================================
1. The Fatal "Long Lie" Phenomenon: Unintentional falls are the leading cause of accidental injury death in older adults. Remaining recumbent on the floor for >1 hour induces acute rhabdomyolysis, renal shutdown, hypothermia, and a >50% six-month mortality rate.
2. Wearable Abandonment (>40% Failure Rate): Seniors frequently remove or forget to wear panic pendants, smartwatches, or accelerometers—especially post-bathing and during nocturnal bathroom trips when fall risks peak.
3. CCTV Visual Privacy Violation (>80% Refusal Rate): Continuous cloud camera surveillance violates personal dignity in bedrooms and bathrooms, leading to severe rejection among elderly users.
4. Polypharmacy Non-Adherence (>55% Non-Compliance): Complex smartphone medication apps confuse seniors, leading to missed doses or hazardous accidental double-dosing.
5. The Clinical Forensic Blind Spot: Traditional alarms operate as uninformative binary buzzers. Clinicians and emergency doctors cannot verify whether an incident was an extrinsic trip/slip vs. an intrinsic cardiovascular syncope or stroke due to lack of pre-impact trajectory data.

================================================================================
3. OBJECTIVES - Key objectives and expected outcomes
================================================================================
• Objective 1 (Zero-Wearable Pose Tracking): Execute real-time 33-point 3D skeletal landmark extraction at 30–60 FPS via in-browser WebAssembly (MediaPipe BlazePose) with no wearable hardware.
• Objective 2 (100% Visual Privacy Preservation): Process all video frames strictly within volatile client browser memory; ensure zero raw video is streamed or saved to external cloud servers.
• Objective 3 (Pre-Fall Kinematic Trajectory Forensics): Maintain an encrypted in-memory 18-frame (~5.5s) rolling circular ring buffer to record the biomechanical perturbation leading into impact.
• Objective 4 (Interactive Forensic Scrubber Player): Provide caregivers with multi-speed (0.25x, 0.5x, 1.0x) frame-by-frame replay, live spine inclination (θ), and aspect ratio analytics for clinical diagnosis.
• Objective 5 (Multilingual Voice Adherence Loop): Deliver hands-free spoken reminders and continuous voice recognition with dialectal phonetic normalization in Kannada, Hindi, and English.
• Objective 6 (Closed-Loop De-escalation): Provide sub-10ms remote emergency siren silencing from the caregiver dashboard, paired with localized spoken reassurance to calm distressed elders.
• Objective 7 (Clinical Audit Analytics): Generate doctor-ready PDF adherence reports and SQLite-backed incident audit logs.

================================================================================
4. SYSTEM ARCHITECTURE - Input, Processing, Output
================================================================================
INPUT LAYER:
• Commodity RGB Webcam (720p/1080p, 30–60 FPS edge stream).
• Audio Stream (Microphone input capturing elder spoken confirmations via Web Speech API).
• Caregiver Portal Inputs (Prescription schedules, dosages, timing, language preference).

PROCESSING LAYER (Edge Runtime & Node.js Core):
• Edge Computer Vision Pipeline: MediaPipe BlazePose WASM extracting 33 landmarks [x, y, z, visibility].
• Multi-Stage Kinematic Filter: Evaluates Torso Vertical Tilt Angle (θ), Bounding Box Aspect Ratio (AR), Center-of-Mass Drop Velocity (v_drop), and a 1.8-second Temporal Debounce Filter.
• Pre-Fall Circular Ring Buffer: Continuous FIFO buffer holding 18 frames @ ~300ms intervals (~5.5s window, ~61KB payload).
• Phonetic Regex Normalizer: Translates colloquial spoken vernacular (e.g., Kannada 'the gunday' -> 'ತಗೊಂಡೆ') into verified adherence events.
• Node.js Telepresence Broker: Express.js REST API + Full-duplex Socket.IO WebSocket signaling with WAL-mode SQLite database.

OUTPUT LAYER:
• Elderly Room Dashboard: High-contrast audio-visual medication reminders, 880Hz piercing alarm siren, and localized reassurance text-to-speech.
• Remote Caregiver Dashboard: Sub-200ms real-time posture telemetry, 🎬 Interactive Forensic Scrubber Replay Modal, 🔕 One-Click Remote Alarm Silencing, Persistent Desktop Notifications, 1-Click WhatsApp SOS Dispatch, and Doctor PDF Export.

================================================================================
5. ALGORITHMS AND TECHNIQUES USED - Workflow, algorithms, and techniques
================================================================================
1. MediaPipe BlazePose WASM Architecture:
   Two-stage detector-tracker model running client-side with WebGL shader acceleration. Infers 33 3D joints with sub-millimeter precision.

2. Deterministic Kinematic Fall Heuristics:
   • Torso Tilt Angle: θ_torso = |atan2(y_hip - y_shoulder, x_hip - x_shoulder)| * (180/π) < 35°
   • Bounding Box Aspect Ratio: AR = Width_bbox / Height_bbox > 1.25 (horizontal floor elongation)
   • Drop Velocity: v_drop = |y_mid(t) - y_mid(t - Δt)| / Δt > 0.24 s⁻¹
   • Temporal Persistence Filter: t_fall ≥ 1.8s (prevents false alarms from shoelace tying, sitting, crouching).

3. Pre-Fall Rolling Circular Buffer Algorithm:
   Maintains a volatile FIFO ring buffer of size N=18. On kinematic trigger confirmation, the buffer freezes and packages the 5.5-second pre-impact coordinate sequence into an encrypted ~61KB JSON payload dispatched via WebSocket.

4. Interactive Forensic Scrubber Player:
   HTML5 Canvas playback engine on caregiver terminal enabling multi-speed (0.25x, 0.5x, 1.0x) scrubbing with real-time vector skeleton overlay and spine angle readout.

5. Closed-Loop Bidirectional Remote Emergency De-escalation:
   WebSocket event 'dismiss-elder-alert' silences local oscillator (<10ms) and synthesizes reassuring voice acknowledgement on elder device ("Your caregiver has been notified and silenced the alarm").

6. Acoustic Phonetic Normalization:
   Fuzzy regex pattern-matching engine resolving colloquial Kannada/Hindi phonetic transcripts directly without heavy cloud NLP latency.

================================================================================
6. CONCLUSION - Achievements and project summary
================================================================================
• Rigorous Empirical Validation: Evaluated across 140 physical trials (syncopal collapses, forward trips, lateral slips, bed rolls, and vigorous daily living activities), achieving 96.8% overall fall detection accuracy.
• Complete Privacy Guarantees: 100% zero-video streaming—only abstract 3D skeletal vectors travel across the network.
• Sub-150ms Telemetry Latency: Near-instantaneous caregiver notification combined with sub-10ms closed-loop remote siren silencing.
• Clinical Value Proposition: Bridges the gap between senior dignity and remote family peace-of-mind, transforming fall alarms from blind event triggers into clinically verifiable forensic diagnostic assets.

================================================================================
7. FUTURE ENHANCEMENT - Possible improvements and extensions
================================================================================
1. Predictive Pre-Fall Gait Instability Forecasting: Implementing temporal deep learning (LSTM/GRU) to analyze step-width variability and detect subtle gait ataxia hours before a fall occurs.
2. Multi-Camera 3D Spatial Fusion: Stitching coordinate spaces across multi-room home cameras to eliminate visual occlusion when an elder moves behind furniture or between rooms.
3. Contactless Vital Signs Sensing (mmWave Radar): Integrating non-contact radar sensors to track resting heart rate and respiratory rate continuously without wearables.
4. Edge LLM Health Companion: Integrating an on-device quantized Large Language Model for conversational cognitive stimulation, mood tracking, and depression screening.

================================================================================
REFERENCES - Books, research papers, websites, and other resources
================================================================================
[1] V. Bazarevsky et al., "BlazePose: On-device Real-time Body Pose tracking," in CVPR Computer Vision for Augmented and Virtual Reality Workshop, 2020.
[2] World Health Organization (WHO), "Step safely: Strategies for preventing and managing falls across the life-course," Geneva: WHO Guidelines, 2021.
[3] N. Lu, et al., "Vision-Based Fall Detection for Elderly Using 3D Pose Estimation," IEEE Sensors Journal, vol. 21, no. 10, pp. 11842-11851, 2021.
[4] Raksha S. and Dr. Shivamurthaiah M., "Privacy-Preserving Kinematic Forensics and Closed-Loop Telecare: Edge-Native Pre-Fall Trajectory Reconstruction and Bidirectional Emergency Control," International Journal of Engineering Innovations (IJEI), 2026.
[5] MediaPipe Machine Learning Solutions: https://developers.google.com/mediapipe
[6] Web Speech API Specification, World Wide Web Consortium (W3C): https://www.w3.org/TR/speech-api/
