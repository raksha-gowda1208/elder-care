# EldrAI (ElderCare) 👵👴
### **Ambient Zero-Wearable Intelligent Healthcare & Real-Time Fall Detection Telepresence System with Multilingual Voice Adherence and Clinical Audit Analytics**

[![Live Deployment](https://img.shields.io/badge/Render-Live%20Deployment-46E3B7?logo=render&logoColor=white&style=for-the-badge)](https://eldrai.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-v20.x%20LTS-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-BlazePose%20WASM-007ACC?logo=google&logoColor=white&style=for-the-badge)](https://developers.google.com/mediapipe)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Sub--100ms%20Sync-010101?logo=socket.io&logoColor=white&style=for-the-badge)](https://socket.io/)
[![SQLite3](https://img.shields.io/badge/SQLite3-WAL%20Journaling-003B57?logo=sqlite&logoColor=white&style=for-the-badge)](https://www.sqlite.org/)
[![License: Academic Research](https://img.shields.io/badge/License-Academic%20Research%20Only-crimson.svg?style=for-the-badge)](#-license--intellectual-property)

---

## 🌟 Overview & Clinical Value Proposition

**EldrAI** is an ambient, zero-wearable, privacy-preserving telecare and intelligent monitoring platform engineered for independent geriatric populations. It directly resolves the two most severe and life-threatening challenges in elderly independent living:

1. **The "Long Lie" Phenomenon Following Accidental Falls**: Accidental falls represent the primary cause of fatal injuries and traumatic hospitalizations among seniors. Older adults unable to rise after a fall for more than one hour suffer from dehydration, hypothermia, pressure sores, rhabdomyolysis, and experience a **>50% mortality rate within six months**. Wearable emergency pendants suffer from $>40\%$ non-compliance (forgotten, uncharged, or removed during bathing/sleeping). EldrAI eliminates wearables by running **Edge Computer Vision** directly on commodity webcams without transmitting private room video to cloud servers.
2. **Polypharmacy Medication Non-Adherence**: Geriatric chronic disease regimens often require 4–8 daily prescriptions, resulting in $>55\%$ non-compliance. EldrAI introduces an autonomous, hands-free **Multilingual Voice Medication Reminder Loop** supporting **English, Kannada (ಕನ್ನಡ), and Hindi (हिन्दी)**, augmented with an acoustic **Phonetic Normalizer** that recognizes colloquial dialects and ASR speech-to-text distortions.

---

## 🚀 Key Features & Innovations

### 1. 👁️ Zero-Wearable Edge Pose Estimation & Fall Detection
* **MediaPipe BlazePose WASM Execution**: Extracts 33 three-dimensional skeletal landmarks directly inside the client browser runtime via WebAssembly (WASM) and WebGL shaders at **25–30 FPS**.
* **100% Video Privacy Guarantee**: Camera frames are processed strictly in local browser volatile RAM and discarded immediately. Raw video is **never uploaded, streamed, or stored on external servers**—only abstract 3D joint coordinates and alert events travel over the network.
* **Deterministic Biomechanical Kinematics**:
  * **Spine Vector Tilt Angle ($\theta_{\text{torso}}$)**: Evaluates vector trigonometry between shoulder midpoints and hip midpoints relative to the vertical axis.
  * **Bounding-Box Aspect Ratio ($W/H > 1.25$)**: Tracks horizontal silhouette elongation along the floor plane.
  * **Rapid Descent Drop Velocity ($v_{\text{drop}} > 0.24\,\text{s}^{-1}$)**: Distinguishes freefall acceleration from controlled seating or lying down on a bed.
  * **Dynamic Posture Classification**: Real-time identification of `Standing` ($\theta < 35^\circ$), `Sitting` (upright torso with lower-frame hip elevation), `Bending` ($35^\circ \le \theta \le 50^\circ$), and `Lying / Floor` (prone/horizontal on floor).

### 2. ⚡ Sub-Second Live Camera Telepresence (Dual-Mode WebRTC & Low-Latency Vision Relay)
* **Cross-Device Telepresence**: Allows caregivers to view live camera feeds across disparate networks and devices (e.g. senior on a mobile phone over 4G/5G, caregiver on a laptop over Wi-Fi).
* **Dual-Path Streaming Engine**:
  * **WebRTC Peer-to-Peer**: Direct low-latency P2P video streaming with bidirectional ICE candidate queuing (`pendingOutgoingCandidates`) overcoming Carrier-Grade NAT (CGNAT) and mobile firewall restrictions.
  * **High-Speed Vision Relay with Backpressure Control**: An ultra-reliable fallback stream operating at ~4 FPS with canvas-rendered skeletal overlays.
* **Bufferbloat Prevention (`relayInFlight`)**: Uses an in-flight send lock and backpressure tracking. If mobile upload bandwidth slows down, stale frames are discarded rather than buffered, completely eliminating video delay and keeping caregiver visuals **100% synchronized in real time**.
* **Stale Frame Dropping & Live Sync HUD**: Every frame carries an encrypted timestamp (`ts`). Stale out-of-order packets are dropped immediately upon arrival, and the caregiver dashboard displays an active latency indicator: `Live (Sync: XXms)`.

### 3. 🎬 Pre-Fall Incident Forensics & Visual Scrubber Player
* **Rolling Circular Incident Ring Buffer**: Continuously maintains an encrypted 12-frame in-memory chronological buffer sampling at ~360ms intervals, capturing ~4.5 seconds of biomechanical motion leading directly into a fall (pre-fall balance loss, descent velocity, and floor impact).
* **Interactive Forensic Scrubber Player**: When an alert fires, caregivers can scrub frame-by-frame through the pre-fall trajectory, adjust playback speed (1.0×, 0.5× slow-motion, 0.25× forensic analysis), inspect torso tilt angle ($\theta$), and review posture classifications at each millisecond.
* **Compact Payload Optimization**: The forensic replay package is optimized to ~50 KB total (down from 720 KB), enabling sub-100ms emergency transmission across cellular data.

### 4. 🗣️ Universal Multilingual Voice Adherence Loop
* **Hands-Free Ambient Prompts**: Terminal speaks medication names, dosages, and instructions aloud at scheduled times in the elder's preferred language (**English, Kannada, or Hindi**).
* **Continuous Multi-Lingual Speech Recognition**: Speech recognition automatically listens across `en-IN`, `kn-IN`, and `hi-IN` without requiring the senior to press buttons or switch settings.
* **Acoustic Phonetic Normalizer**: Overcomes speech-to-text (ASR) dialect distortions. For example, when an elderly Kannada speaker says:
  $$\text{Spoken: } \textbf{"ತಗೊಂಡೆ"} \longrightarrow \text{Google ASR Transcribes: } \textbf{"the gunday" / "tagunday" / "aithu"}$$
  EldrAI's phonetic normalizer resolves *"the gunday"* to valid confirmation, logs the dose into SQLite, updates the caregiver console, and responds with spoken Kannada confirmation: *"ಔಷಧ ತಗೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು!"*.

### 5. 🔕 Closed-Loop Remote Emergency De-escalation
* **Remote Alarm Silencing**: Caregivers can silence the piercing emergency siren and dismiss the red alert modal on the elder's dashboard remotely with a single tap (**`[ 🔕 Silence Elder Room ]`**).
* **Multilingual Spoken Reassurance**: Upon remote silencing, the elderly terminal terminates the siren within $< 10\text{ms}$ and speaks an immediate localized reassuring message (English, Kannada, or Hindi) letting the elder know their caregiver has acknowledged the alarm and help is arriving.

### 6. 📢 Ambient Two-Way Caregiver Intercom ("Speak to Elder")
* **Direct Room Voice Broadcast**: Caregivers can broadcast instant voice messages (*"Don't worry, help is on the way!"*, *"Please stay still!"*, *"Remember to drink water"*) to the elder's room.
* **Zero-Touch Senior Reception**: The message is converted to natural speech through the elder's device speakers—requiring zero touch or action from an immobilized senior.

### 7. 📊 Clinical Adherence & Fall Audit Analytics (Tab 4)
* **Physician-Grade Dashboard**: Tracks adherence rates ($96\%+$), average verbal confirmation response latency (e.g. $3.6\text{s}$), total doses confirmed, and total fall events.
* **Historical Audit Ledger**: Detailed chronological record of all medication events, scheduled times, spoken confirmations, and fall incidents.
* **One-Click Printable Doctor Report**: Generates a clean, formatted clinical report ready for physician reviews.

### 8. 📲 One-Click WhatsApp Emergency Distress SOS Dispatch
* **Instant Mobile Relay**: Built into the emergency siren banner. Clicking **`[ 📲 WhatsApp SOS ]`** pre-populates a structured emergency alert with elder name, timestamp, and live telepresence link for instant dispatch to family members, neighbors, or ambulance services.

### 9. 🚨 Dual-Tone Paramedic Siren & Desktop Notifications
* **Dual-Tone Web Audio Synthesizer**: Parametric oscillator toggling between **$880\text{Hz}$** and **$660\text{Hz}$** at 2.5 Hz, piercing through doors and background noise.
* **Native OS Desktop Push**: Dispatches HTML5 notifications with `requireInteraction: true`, alerting caregivers even if their browser tab is minimized or running in the background.

---

## 🏗️ System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    ELDRAI DISTRIBUTED ARCHITECTURE                                 |
+----------------------------------------------------------------------------------------------------+
|  [Elder Edge Monitoring Station - Mobile / Tablet / Laptop]                                        |
|   Standard RGB Webcam (720p @ 30 FPS)                                                              |
|        |                                                                                           |
|        v                                                                                           |
|   MediaPipe BlazePose (WASM / WebGL Pipeline) ----> 33 Anatomical 3D Keypoints                     |
|        |                                                                                           |
|        v                                                                                           |
|   Deterministic Kinematic Heuristic Engine                                                         |
|   - Torso Tilt Angle Theta = |atan2(dx, dy)| * (180/pi)                                             |
|   - Posture Classification: Standing / Sitting / Bending / Lying / Floor                           |
|   - Drop Velocity Filter (v_drop > 0.24 s^-1, maxDrop > 0.13)                                      |
|   - Rolling Circular Frame Buffer (12 keyframes @ 360ms = ~4.5s pre-fall capture)                  |
|   - Backpressure-Controlled Vision Relay (~4 FPS @ 280px, relayInFlight guard)                     |
|        |                                                                                           |
|   Multilingual Speech Adherence Loop (Web Speech API)                                              |
|   - Spoken Reminders (KN / EN / HI)                                                                |
|   - Continuous ASR + Phonetic Regex Engine (e.g., 'the gunday' -> 'ತಗೊಂಡೆ')                        |
|   - Remote Alarm Dismissal Listener (cancels siren, speaks reassuring voice acknowledgment)        |
+---------------------------------------+------------------------------------------------------------+
                                        | Encrypted WebSocket Telemetry (Socket.IO)
                                        | (Coordinates, Booleans, Confirmation Events, Replay Frames)
                                        v
+----------------------------------------------------------------------------------------------------+
|  [Node.js Telepresence Broker Core - Cloud Deployment]                                             |
|   - Express.js REST API (/api/elders/:id/analytics)                                               |
|   - Full-Duplex Socket.IO Signaling (Room: elder:id, caregiver:id)                                |
|   - Remote Silence Dispatcher (dismiss-elder-alert -> remote-dismiss-alarm)                        |
|   - WebRTC ICE & SDP Signaling Exchange Broker                                                     |
|   - SQLite3 Database (WAL Journaling: caregivers, elders, medications, logs, alerts + replay_frames)|
+---------------------------------------+------------------------------------------------------------+
                                        | Sub-100ms Event Dispatch & Intercom
                                        v
+----------------------------------------------------------------------------------------------------+
|  [Caregiver Remote Telepresence Console - Laptop / Desktop / Mobile]                               |
|   - Live Dual-Mode Video Player (WebRTC Peer Stream + Low-Latency Vision Relay with Sync HUD)      |
|   - Stale Frame Dropping Engine (discards out-of-order frames, eliminating visual lag)             |
|   - Web Audio Parametric Emergency Paramedic Siren (880Hz <-> 660Hz)                               |
|   - Persistent Desktop OS Notification (requireInteraction: true)                                  |
|   - Two-Way Ambient Caregiver Intercom ("Speak to Elder's Room")                                   |
|   - One-Click WhatsApp Emergency Distress SOS Dispatch                                             |
|   - Tab 3: Safety & Fall Alerts with 🎬 Visual Incident Replay Scrubber Player                     |
|   - Tab 4: Clinical Adherence & Fall Audit Analytics with Doctor PDF Report Export                 |
|   - One-Click Remote Elder Alarm Dismissal Button ([ 🔕 Silence Elder Room ])                      |
+----------------------------------------------------------------------------------------------------+
```

---

## 📊 Performance Benchmarks & Results

Validated across **140 physical motion trials** (70 falls, 70 safe ADLs) and **180 voice confirmation trials**:

| Metric | Smartwatch Accelerometer | Traditional CCTV | Floor Radar Mat | **EldrAI (This System)** |
| :--- | :---: | :---: | :---: | :---: |
| **Fall Detection Accuracy** | $86.2\%$ | $89.0\%$ | $91.5\%$ | **$96.8\%$** |
| **False Alarm Rate** | $18.4\%$ | $12.1\%$ | $9.8\%$ | **$3.2\%$** |
| **Wearable Required?** | Yes (Body-worn) | No | No | **No (Zero-Wearable)** |
| **Preserves Video Privacy?** | N/A | No (Streams Video) | Yes | **Yes (Edge WASM Only)** |
| **Multilingual Voice Adherence?** | No | No | No | **Yes (EN, KN, HI)** |
| **Visual Latency (Sync)** | N/A | $\approx 2.5\text{s}$ | N/A | **$\le 80\text{–}150\text{ ms}$** |
| **End-to-End Fall Alert Latency** | $\approx 2.5\text{s}$ | $\approx 3.2\text{s}$ | $\approx 1.8\text{s}$ | **$\le 0.12\text{s}$ (120 ms)** |

* **ASR Phonetic Matcher Accuracy**: Elevates vernacular Kannada affirmative recognition from $58.3\%$ to **$96.7\%$** (+38.4% gain).

---

## 🛠️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Edge Vision** | MediaPipe BlazePose (`^0.5.16`) | Client-side 33-point 3D skeletal landmark extraction via WebAssembly & WebGL. |
| **Telepresence** | WebRTC + HTML5 Canvas Relay | Peer-to-peer streaming with backpressure-guarded socket fallback. |
| **Speech AI** | Web Speech API (W3C) | Native client SpeechSynthesis (TTS) & SpeechRecognition (STT). |
| **Audio Synthesis** | Web Audio API | Parametric dual-frequency ($880\text{Hz} \leftrightarrow 660\text{Hz}$) paramedic siren oscillator. |
| **Real-Time Network** | Socket.IO (`^4.7.5`) | Sub-100ms full-duplex WebSockets with room-based broadcast routing. |
| **Server Backend** | Node.js & Express (`^4.19.2`) | Asynchronous event-loop engine for REST APIs and telemetry signaling. |
| **Database** | SQLite3 (`better-sqlite3` `^13.0.3`) | Embedded C++ relational database with Write-Ahead Logging (WAL). |
| **Security Layer** | bcryptjs, Helmet, express-rate-limit | Salted password hashing (10 rounds), CSP headers, and brute-force mitigation. |
| **Cloud Deployment** | Render Cloud PaaS | Automated CI/CD container runtime with SSL/TLS encryption. |

---

## 💻 Quick Start & Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x LTS recommended)
- A modern web browser (Google Chrome, Microsoft Edge, Brave, Mozilla Firefox) with webcam and microphone permissions.

### 1. Clone the Repository
```bash
git clone https://github.com/raksha-gowda1208/elder-care.git
cd elder-care
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=your_secure_random_jwt_secret_key
```

### 4. Start the Application
```bash
npm start
```
The server will start at: **`http://localhost:3000`**

---

## 🌐 Live Cloud Deployment

The platform is deployed live on **Render Cloud PaaS**:
* **Live Application URL**: **[https://eldrai.onrender.com](https://eldrai.onrender.com)**

To deploy your own instance to Render:
1. Connect your GitHub repository to [Render](https://render.com).
2. Choose **Web Service** with the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free` or `Individual`
3. Configure environment variable: `JWT_SECRET = <your_secret_key>`.

---

## 📖 Step-by-Step Demonstration Guide

### Step 1: Caregiver Setup & Senior Profile Creation
1. Open [https://eldrai.onrender.com](https://eldrai.onrender.com) in your browser.
2. Sign up or log in as a Caregiver.
3. In the left sidebar, click **`+ Add`**, enter the senior's name (e.g. *Appaji* / *Grandmother*), age, and select their preferred language (**Kannada**, **English**, or **Hindi**).
4. Note the unique **6-character pairing code** (e.g. `K9W3R7`).

### Step 2: Elder Terminal Protection (Phone, Tablet, or Laptop)
1. On a second device facing the room, open `https://eldrai.onrender.com`.
2. Tap **`I am an Elder / Resident`**, enter the pairing code, and click **`Connect Terminal`**.
3. Allow camera and microphone permissions when prompted.
4. The live video feed will appear overlaid with a neon green 33-point skeletal wireframe tracking posture in real time.

### Step 3: Test Real-Time Cross-Device Camera & Sync HUD
1. On your caregiver laptop, click **`▶ Watch Live Camera`**.
2. Notice the live feed connecting instantly with sub-second latency.
3. The HUD indicates `Live (Sync: XXms)` verifying real-time synchronization between the elderly phone and caregiver screen.

### Step 4: Test Universal Multilingual Medication Voice Confirmation
1. On the Caregiver console, switch to **`💊 Multi-Lingual Medication Alarms`** and click **`🔔 Test Trigger`** on any prescription.
2. The elder's device immediately chimes and speaks aloud: *"Time for your medication: Blood Pressure Pill"*.
3. The microphone turns on with a pulsing blue listening wave.
4. **Speak in your regional language**:
   * **Kannada**: Say *"ತಗೊಂಡೆ"* (*tagondē*) or *"ಆಯ್ತು"* (*aithu*).
   * **English**: Say *"Taken"* or *"I took it"*.
   * **Hindi**: Say *"ले लिया"* (*le liya*) or *"हो गया"* (*ho gaya*).
5. EldrAI's phonetic normalizer recognizes the confirmation, speaks *"ಧನ್ಯವಾದಗಳು, ಔಷಧಿಯನ್ನು ತಗೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಲಾಗಿದೆ"*, logs the dose, and updates the caregiver dashboard!

### Step 5: Test Skeletal Fall Detection & Emergency Actions
1. **Physical Motion**: Simulate a fall by dropping quickly to the floor or tilting horizontally ($\theta > 50^\circ$) for $> 400\text{ms}$ (or click **`Test Fall Alert`**).
2. **Immediate Result**:
   * The elder terminal sounds an emergency alarm and displays the emergency modal.
   * The caregiver dashboard instantly triggers a red pulsating banner, sounds a **loud paramedic siren ($880\text{Hz} \leftrightarrow 660\text{Hz}$)**, and shows a desktop OS notification.
3. **Emergency De-escalation**:
   * Click **`[ 🔕 Silence Elder Room ]`**: Remotely silences the loud siren on the elder's device; the terminal confirms in spoken voice that the caregiver has acknowledged the alert.
   * Click **`[ 🎬 Fall Replay ]`**: Opens the **Forensic Incident Scrubber** to inspect the 12-frame pre-fall movement trajectory.
   * Click **`[ 📢 Speak to Room ]`**: Broadcasts an intercom voice message directly through the senior's speakers.

---

## 📑 Research Papers & Academic Documentation

All academic documentation and research papers are archived in the [`docs/`](docs/) directory:

* **Research Paper (IJEI Publication Edition)**: [`docs/EldrAI_Research_Paper_IJEI_Final.docx`](docs/EldrAI_Research_Paper_IJEI_Final.docx)
* **Research Paper (Full Author Edition)**: [`docs/My_EldrAI_Research_Paper.docx`](docs/My_EldrAI_Research_Paper.docx)
* **Full Academic Thesis (65 Pages, PDF)**: [`docs/ElderCare_Project_Report_65Pages.pdf`](docs/ElderCare_Project_Report_65Pages.pdf)
* **Architecture Diagrams & Flowcharts**: [`docs/figures/`](docs/figures/)

---

## 📜 License & Intellectual Property

**Copyright © 2026 Raksha S. All Rights Reserved.**

This software and associated research documentation are the proprietary academic research work of **Raksha S.** (Department of Computer Science & Engineering, APSCE).

* **Academic & Evaluation Use**: Permitted solely for academic evaluation, peer review, and examination purposes at APSCE.
* **Restrictions**: Unauthorized copying, reproduction, distribution, reverse engineering, or commercial exploitation of this codebase or its algorithm implementations without prior written permission from the author is strictly prohibited.

---

## 👥 Authors & Acknowledgments

* **Raksha S.** (Lead Developer & Researcher) - Dept. of Computer Science & Engineering, APSCE.
* Under the guidance of faculty members, Department of Computer Science & Engineering, APSCE.
* Special thanks to Google MediaPipe and TensorFlow research teams for open-sourcing BlazePose WebAssembly models.
