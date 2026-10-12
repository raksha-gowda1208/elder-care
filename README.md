# ElderCare — AI Vision Safety & Voice Medication Assistant

An intelligent assistive care system designed for elderly individuals living alone, connecting them with remote caregivers through real-time computer vision, automated voice interactions, and instant emergency alerts.

---

## 🌟 Key Features

### 1. 🧓 Elderly Person Dashboard
- **Real-Time Skeleton Pose Fall Detection**:
  - Runs local on-device pose estimation with **MediaPipe Pose** (33 3D body keypoints).
  - Dynamic biomechanical tracking: Torso angle, vertical drop velocity, bounding box aspect ratio, and floor proximity.
  - **Dual Detection Engines**:
    1. *Dynamic Fall*: Sudden downward acceleration followed by prone/ground posture.
    2. *Prolonged Floor Immobility*: Collapse or lying on the floor for $\ge 2.8$ seconds.
  - On-screen telemetry HUD (Posture: Standing/Sitting/Lying, Torso Angle, Stability Score, FPS).
  - High-visibility emergency siren tone and audio announcement with large *"I'm OK (Cancel)"* false-alarm dismissal button.
- **Interactive Repeating Voice Medication Alarms**:
  - Reminders trigger automatically at the scheduled time.
  - Speaks the medication name & dosage aloud (or plays the caregiver's recorded voice clip).
  - **Microphone turns on automatically** right after speaking with visual pulsing soundwaves.
  - Web Speech Recognition listens continuously for confirmations: *“taken”*, *“done”*, *“yes”*, *“i took it”*, *“finished”*, etc.
  - **Repeating loop**: If not answered, repeats the spoken reminder every 11 seconds until confirmed.
  - Confirms with a cheerful chime, speaks *"Thank you, marked as taken!"*, and notifies the caregiver dashboard.
- **Convenient Demonstration & Testing Toolbar**:
  - *"⚡ Test Fall Alert"*: Simulates fall detection and email dispatch without having to drop to the floor.
  - *"💊 Test Medicine Voice Alarm"*: Immediately triggers voice reminder and microphone listening.
  - *"🚨 SOS Help"*: One-tap emergency help request.

### 2. 👩‍⚕️ Caregiver Operations Portal
- **Elder Registration & Pairing**:
  - Register elderly individuals with name, age, and notes/room location.
  - Generates a unique 6-character pairing code with 1-click clipboard copy.
  - Live device status indicator (🟢 Online / ⚪ Offline).
- **Live Camera Monitoring Station**:
  - Live video streaming powered by WebRTC P2P + automatic fallback snapshot frame relay.
  - Live posture telemetry tag (e.g., *Standing 12°*, *Sitting 32°*, *Floor Lying 78°*).
  - One-click simulated fall alert for testing.
- **Medication Scheduling & Voice Studio**:
  - Add reminders with date, time, and optional daily repetition.
  - **Built-in Voice Recording Studio**: Record personalized caregiver audio messages (*“Hi Mom, take your blue pill!”*) with live timer and preview.
  - Schedule audit trail with live status badges: *Taken (Voice)*, *Pending*, or *Missed*.
  - *"🔔 Test Trigger"* button to dispatch any medication reminder immediately.
- **Immediate Fall Alert & Email Notification System**:
  - Sticky flashing emergency alert banner with audio siren alarm.
  - **Instant High-Priority Email Dispatch**: Emails caregiver immediately upon fall detection.
  - In-app **Email & SMTP Settings Modal**: Configure Gmail App Passwords, Outlook, or custom SMTP servers.
  - Automatic test fallback with live preview links (via Ethereal) so alert emails work out of the box even before configuring Gmail.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- Modern web browser (Chrome, Edge, Firefox, or Safari) with webcam and microphone permissions

### Installation & Launch

```bash
# Navigate to the elder-care directory
cd C:\Users\Raksha\elder-care\elder-care

# Install dependencies (if not already installed)
npm install

# Start the server
npm start
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## 📱 How to Demo the System

### Step 1: Open the Caregiver Dashboard
1. On [http://localhost:3000](http://localhost:3000), enter your name, email, and password to create a caregiver account or sign in.
2. Under **Monitored Persons**, click **+ Add** and enter the elder's name (e.g. *Robert Connor*) and age.
3. Note the 6-character pairing code (e.g. `ABC123`).

### Step 2: Open the Elderly Person Dashboard
1. Open a new browser window or open the app on a second device / tablet on the same Wi-Fi network: `http://<your-computer-ip>:3000`.
2. Enter the pairing code under **Home device** and click **Open Elderly Dashboard**.
3. Click **▶ Start Protection** and allow Camera and Microphone permissions.
4. You will see the live camera feed with an overlaid neon skeleton tracking body movements in real-time.

### Step 3: Test Voice Medication Reminders
1. In the Caregiver Dashboard, navigate to the **💊 Voice Medication Reminders** tab and click **🔔 Test Trigger** on any medication (or click **💊 Test Medicine Voice Alarm** on the Elderly screen).
2. The elderly device will chime and announce: *"Time for your medicine, [Name]..."*.
3. Notice the microphone indicator turning green with animated sound waves.
4. Say clearly into the microphone: **"Taken"** or **"Done"**.
5. The device will acknowledge with a chime, speak *"Thank you, marked as taken!"*, and the caregiver dashboard will show a green confirmation badge!

### Step 4: Test Skeleton Fall Detection & Email Alerts
- **Method A (Real-Life Motion)**: Stand in front of the camera, then drop quickly onto a chair, couch, or floor and stay in a horizontal position for 1 second.
- **Method B (Simulation Button)**: Click **⚡ Test Fall Alert** on either screen.
- **Result**:
  1. The elderly screen displays a full-screen red emergency alarm with a siren.
  2. The caregiver screen flashes an immediate emergency banner and sounds an audible alert.
  3. A high-priority emergency email is dispatched to the caregiver's registered email address immediately.
  4. If using test mail mode, click the preview link in the banner to view the formatted emergency alert email in your browser!

---

## 🛠️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Backend** | Node.js, Express | REST API, static asset serving, rate limiting, and security headers |
| **WebSockets** | Socket.IO | Real-time signaling, alert push, posture telemetry, and frame relay |
| **Database** | SQLite (`better-sqlite3`) | Fast embedded database with WAL mode for caregivers, elders, meds, logs, and alerts |
| **AI Vision** | MediaPipe Pose | Local client-side 33-point skeleton pose estimation |
| **Speech AI** | Web Speech API | SpeechSynthesis for reminders & SpeechRecognition for hands-free voice responses |
| **Audio** | Web Audio API | Custom synthesizers for sirens, chimes, and caregiver voice recording |
| **Video** | WebRTC + Canvas Relay | P2P video stream with automatic snapshot relay fallback |
| **Email** | Nodemailer | High-priority emergency alerts via SMTP or Ethereal test inbox |
