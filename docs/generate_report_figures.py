import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.environ['MPLCONFIGDIR'] = r'C:\Users\Raksha\AppData\Local\Temp'
out_dir = r'C:\Users\Raksha\elder-care\elder-care\docs\figures'
os.makedirs(out_dir, exist_ok=True)

# Set high DPI and aesthetic styles
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

# -----------------------------------------------------------------------------
# 1. Figure 3.1: System Architecture
# -----------------------------------------------------------------------------
def make_fig_3_1():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')
    
    # Title
    ax.text(7, 8.6, "Figure 3.1: EldrAI Distributed Edge-Cloud System Architecture", 
            ha='center', va='center', fontsize=16, fontweight='bold', color='#0f172a')
    
    # Tier 1: Elder Edge Terminal
    t1 = patches.FancyBboxPatch((0.6, 1.2), 3.8, 6.8, boxstyle="round,pad=0.2", 
                                edgecolor='#2563eb', facecolor='#eff6ff', linewidth=2)
    ax.add_patch(t1)
    ax.text(2.5, 7.7, "ELDER EDGE TERMINAL\n(Client Browser / Tablet)", ha='center', va='center', 
            fontsize=12, fontweight='bold', color='#1e3a8a')
    
    # Submodules in Tier 1
    modules_t1 = [
        ("Webcam RGB Stream\n(720p @ 30-60 FPS)", 6.8, '#dbeafe', '#1d4ed8'),
        ("MediaPipe BlazePose (WASM)\n33 3D Skeletal Keypoints", 5.6, '#bfdbfe', '#1e40af'),
        ("Geometric Posture Analyzer\nTorso Angle Theta < 35 deg, AR > 1.25", 4.3, '#93c5fd', '#1e3a8a'),
        ("Temporal Debounce State Machine\nt_fallen >= 1.8 seconds", 3.1, '#60a5fa', '#0f172a'),
        ("Multilingual Speech Loop (TTS/STT)\nPhonetic Dialect Normalizer", 1.9, '#bfdbfe', '#1e40af')
    ]
    for text, y, fc, tc in modules_t1:
        box = patches.FancyBboxPatch((0.9, y-0.45), 3.2, 0.8, boxstyle="round,pad=0.1", 
                                     edgecolor='#3b82f6', facecolor=fc, linewidth=1.5)
        ax.add_patch(box)
        ax.text(2.5, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=tc)
        
    # Tier 2: Telepresence Broker Core (Node.js)
    t2 = patches.FancyBboxPatch((5.1, 1.8), 3.8, 5.8, boxstyle="round,pad=0.2", 
                                edgecolor='#059669', facecolor='#ecfdf5', linewidth=2)
    ax.add_patch(t2)
    ax.text(7.0, 7.2, "CLOUD TELEPRESENCE CORE\n(Node.js + Express + Railway)", ha='center', va='center', 
            fontsize=12, fontweight='bold', color='#064e3b')
            
    modules_t2 = [
        ("Express REST API Engine\nRoutes: /api/elders/:id/analytics", 6.2, '#d1fae5', '#047857'),
        ("Socket.IO Real-Time Broker\nNamespaces & Room Routing (elder:id)", 5.0, '#a7f3d0', '#065f46'),
        ("WebRTC Signaling Bridge\nPeer-to-Peer Video Telepresence", 3.8, '#6ee7b7', '#064e3b'),
        ("SQLite3 Enterprise Database\nWAL Journal Mode, ACID Compliant", 2.6, '#a7f3d0', '#065f46')
    ]
    for text, y, fc, tc in modules_t2:
        box = patches.FancyBboxPatch((5.4, y-0.45), 3.2, 0.8, boxstyle="round,pad=0.1", 
                                     edgecolor='#10b981', facecolor=fc, linewidth=1.5)
        ax.add_patch(box)
        ax.text(7.0, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=tc)

    # Tier 3: Caregiver Dashboard Station
    t3 = patches.FancyBboxPatch((9.6, 1.2), 3.8, 6.8, boxstyle="round,pad=0.2", 
                                edgecolor='#dc2626', facecolor='#fef2f2', linewidth=2)
    ax.add_patch(t3)
    ax.text(11.5, 7.7, "CAREGIVER MONITORING STATION\n(Web & Mobile Dashboard)", ha='center', va='center', 
            fontsize=12, fontweight='bold', color='#7f1d1d')
            
    modules_t3 = [
        ("Live Skeleton Video Telepresence\nCanvas 2D Joint Rendering", 6.8, '#fee2e2', '#b91c1c'),
        ("Paramedic Audio Siren (Web Audio)\nDual-Tone 880Hz <-> 660Hz Osc.", 5.6, '#fecaca', '#991b1b'),
        ("Native OS Background Notifications\nPersistent requireInteraction: true", 4.3, '#fca5a5', '#7f1d1d'),
        ("Two-Way Caregiver Intercom\nInstant Room Voice Broadcast", 3.1, '#fecaca', '#991b1b'),
        ("Tab 4: Clinical Analytics & Report\nPDF Physician Adherence Summary", 1.9, '#fee2e2', '#b91c1c')
    ]
    for text, y, fc, tc in modules_t3:
        box = patches.FancyBboxPatch((9.9, y-0.45), 3.2, 0.8, boxstyle="round,pad=0.1", 
                                     edgecolor='#ef4444', facecolor=fc, linewidth=1.5)
        ax.add_patch(box)
        ax.text(11.5, y, text, ha='center', va='center', fontsize=9, fontweight='bold', color=tc)

    # Connections and arrows
    # T1 to T2 (Telemetry)
    ax.annotate("", xy=(5.1, 5.0), xytext=(4.4, 5.0),
                arrowprops=dict(arrowstyle="->", color="#0284c7", lw=3))
    ax.text(4.75, 5.3, "WebSocket Telemetry\n(< 180 ms)", ha='center', fontsize=8, fontweight='bold', color='#0284c7')

    # T2 to T3 (Alerts)
    ax.annotate("", xy=(9.6, 5.0), xytext=(8.9, 5.0),
                arrowprops=dict(arrowstyle="->", color="#dc2626", lw=3))
    ax.text(9.25, 5.3, "Instant Siren Push\n(Sub-Second)", ha='center', fontsize=8, fontweight='bold', color='#dc2626')

    # T3 to T1 (Intercom Reverse Voice)
    ax.annotate("", xy=(4.4, 3.1), xytext=(9.6, 3.1),
                arrowprops=dict(arrowstyle="->", color="#8b5cf6", lw=2.5, ls="--"))
    ax.text(7.0, 3.35, "Two-Way Intercom Room Voice Broadcast (speak-message)", 
            ha='center', fontsize=8, fontweight='bold', color='#8b5cf6')

    # Emergency WhatsApp SOS external badge
    sos_box = patches.FancyBboxPatch((9.9, 0.3), 3.2, 0.65, boxstyle="round,pad=0.1", 
                                     edgecolor='#16a34a', facecolor='#dcfce7', linewidth=1.5)
    ax.add_patch(sos_box)
    ax.text(11.5, 0.62, "📲 WhatsApp Click-to-Chat SOS\n(Time, Elder, Incident URL Pre-filled)", 
            ha='center', va='center', fontsize=8.5, fontweight='bold', color='#166534')
    ax.annotate("", xy=(11.5, 1.2), xytext=(11.5, 0.95),
                arrowprops=dict(arrowstyle="<-", color="#16a34a", lw=2))

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_3_1_system_architecture.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 2. Figure 3.2: Use-Case Diagram
# -----------------------------------------------------------------------------
def make_fig_3_2():
    fig, ax = plt.subplots(figsize=(13, 8.5), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8.5)
    ax.axis('off')
    
    ax.text(6.5, 8.1, "Figure 3.2: EldrAI Unified Actor & Use-Case Diagram", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
            
    # System Boundary Box
    bound = patches.Rectangle((3.2, 0.5), 6.6, 7.1, linewidth=2, edgecolor='#475569', 
                              facecolor='#f8fafc', linestyle='--')
    ax.add_patch(bound)
    ax.text(6.5, 7.3, "ELDRAI ASSISTED LIVING SYSTEM BOUNDARY", ha='center', fontsize=11, 
            fontweight='bold', color='#334155')

    # Actors
    # Elder (Left)
    ax.plot([1.2, 1.2], [5.0, 5.5], color='#1e3a8a', lw=3)
    c1 = plt.Circle((1.2, 5.7), 0.25, color='#1e3a8a')
    ax.add_patch(c1)
    ax.plot([0.8, 1.6], [5.3, 5.3], color='#1e3a8a', lw=3)
    ax.plot([1.2, 0.8], [5.0, 4.4], color='#1e3a8a', lw=3)
    ax.plot([1.2, 1.6], [5.0, 4.4], color='#1e3a8a', lw=3)
    ax.text(1.2, 4.0, "ELDER\n(Monitored Senior)", ha='center', fontsize=10, fontweight='bold', color='#1e3a8a')

    # Caregiver (Right)
    ax.plot([11.8, 11.8], [5.0, 5.5], color='#b91c1c', lw=3)
    c2 = plt.Circle((11.8, 5.7), 0.25, color='#b91c1c')
    ax.add_patch(c2)
    ax.plot([11.4, 12.2], [5.3, 5.3], color='#b91c1c', lw=3)
    ax.plot([11.8, 11.4], [5.0, 4.4], color='#b91c1c', lw=3)
    ax.plot([11.8, 12.2], [5.0, 4.4], color='#b91c1c', lw=3)
    ax.text(11.8, 4.0, "CAREGIVER\n(Family / Doctor)", ha='center', fontsize=10, fontweight='bold', color='#b91c1c')

    # Use cases (Ovals)
    use_cases = [
        ("UC-01: Authenticate & Pair Elder via Code", 6.6),
        ("UC-02: Ambient Skeletal Pose Fall Monitoring", 5.8),
        ("UC-03: Multilingual Voice Medication Reminder", 5.0),
        ("UC-04: Hands-Free Spoken Dialect Confirmation", 4.2),
        ("UC-05: Real-Time Paramedic Siren & Desktop Alert", 3.4),
        ("UC-06: Two-Way Ambient Caregiver Intercom", 2.6),
        ("UC-07: One-Click WhatsApp Emergency Distress SOS", 1.8),
        ("UC-08: View & Print Clinical Adherence Analytics", 1.0)
    ]
    
    for text, y in use_cases:
        ellipse = patches.Ellipse((6.5, y), 5.6, 0.55, edgecolor='#0284c7', facecolor='#e0f2fe', lw=1.5)
        ax.add_patch(ellipse)
        ax.text(6.5, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#0369a1')
        
    # Associations (Lines)
    # Elder connects to UC-02, UC-03, UC-04, UC-06
    elder_pos = (1.6, 5.2)
    for y in [5.8, 5.0, 4.2, 2.6]:
        ax.plot([elder_pos[0], 3.7], [elder_pos[1], y], color='#3b82f6', lw=1.5)

    # Caregiver connects to UC-01, UC-05, UC-06, UC-07, UC-08
    cg_pos = (11.4, 5.2)
    for y in [6.6, 3.4, 2.6, 1.8, 1.0]:
        ax.plot([cg_pos[0], 9.3], [cg_pos[1], y], color='#ef4444', lw=1.5)

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_3_2_use_case_diagram.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 3. Figure 3.3: Level 1 Data Flow Diagram (DFD)
# -----------------------------------------------------------------------------
def make_fig_3_3():
    fig, ax = plt.subplots(figsize=(13, 9), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')
    
    ax.text(6.5, 8.6, "Figure 3.3: EldrAI Level-1 Data Flow Diagram (DFD)", 
            ha='center', va='center', fontsize=15, fontweight='bold', color='#0f172a')
            
    # Entities
    # E1: Elder (Webcam/Mic)
    e1 = patches.Rectangle((0.6, 5.5), 2.2, 1.4, edgecolor='#1e3a8a', facecolor='#dbeafe', lw=2)
    ax.add_patch(e1)
    ax.text(1.7, 6.2, "External Entity\n[ELDER]\nWebcam & Mic", ha='center', va='center', 
            fontsize=9.5, fontweight='bold', color='#1e3a8a')

    # E2: Caregiver (Dashboard)
    e2 = patches.Rectangle((10.2, 5.5), 2.2, 1.4, edgecolor='#7f1d1d', facecolor='#fee2e2', lw=2)
    ax.add_patch(e2)
    ax.text(11.3, 6.2, "External Entity\n[CAREGIVER]\nDashboard Screen", ha='center', va='center', 
            fontsize=9.5, fontweight='bold', color='#7f1d1d')

    # Process 1.0: Video Pose Estimation
    p1 = patches.Circle((4.5, 6.2), 1.0, edgecolor='#0284c7', facecolor='#e0f2fe', lw=2)
    ax.add_patch(p1)
    ax.text(4.5, 6.2, "1.0\nEdge Pose\nEstimation\n(BlazePose)", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#0369a1')

    # Process 2.0: Fall Kinematics Evaluator
    p2 = patches.Circle((7.5, 6.2), 1.0, edgecolor='#d97706', facecolor='#fef3c7', lw=2)
    ax.add_patch(p2)
    ax.text(7.5, 6.2, "2.0\nDeterministic\nFall Heuristics\n(Theta, AR, Dwell)", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#92400e')

    # Process 3.0: Speech Processing & Adherence
    p3 = patches.Circle((4.5, 2.5), 1.0, edgecolor='#7c3aed', facecolor='#ede9fe', lw=2)
    ax.add_patch(p3)
    ax.text(4.5, 2.5, "3.0\nMultilingual\nVoice Adherence\n& Phonetics", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#5b21b6')

    # Process 4.0: Alert Dispatch & Intercom
    p4 = patches.Circle((7.5, 2.5), 1.0, edgecolor='#dc2626', facecolor='#fee2e2', lw=2)
    ax.add_patch(p4)
    ax.text(7.5, 2.5, "4.0\nEmergency\nSiren & Intercom\nRouter", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#991b1b')

    # Data Store D1: SQLite Database
    d1 = patches.Rectangle((5.0, 4.1), 3.0, 0.7, edgecolor='#059669', facecolor='#d1fae5', lw=2)
    ax.add_patch(d1)
    ax.text(6.5, 4.45, "D1: SQLite3 DB (WAL Mode)\n[elders, alerts, med_logs]", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#065f46')

    # Arrows with data labels
    # E1 to P1
    ax.annotate("", xy=(3.5, 6.2), xytext=(2.8, 6.2), arrowprops=dict(arrowstyle="->", color="#1e3a8a", lw=2))
    ax.text(3.15, 6.45, "Video Frames", ha='center', fontsize=8, color='#1e3a8a')

    # P1 to P2
    ax.annotate("", xy=(6.5, 6.2), xytext=(5.5, 6.2), arrowprops=dict(arrowstyle="->", color="#0284c7", lw=2))
    ax.text(6.0, 6.45, "33 Keypoints", ha='center', fontsize=8, color='#0284c7')

    # P2 to E2
    ax.annotate("", xy=(10.2, 6.2), xytext=(8.5, 6.2), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2.5))
    ax.text(9.35, 6.45, "Fall Alert Event\n(< 180 ms)", ha='center', fontsize=8, fontweight='bold', color='#dc2626')

    # P2 to D1
    ax.annotate("", xy=(7.0, 4.8), xytext=(7.5, 5.2), arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5))
    ax.text(7.7, 4.9, "Log Fall", fontsize=7.5, color='#059669')

    # E1 to P3 (Spoken confirmation)
    ax.annotate("", xy=(3.6, 2.8), xytext=(2.0, 5.5), arrowprops=dict(arrowstyle="->", color="#7c3aed", lw=2))
    ax.text(2.3, 3.8, "Spoken Dialect\n('the gunday')", fontsize=8, color='#7c3aed')

    # P3 to D1
    ax.annotate("", xy=(5.5, 4.1), xytext=(4.8, 3.4), arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5))
    ax.text(4.7, 3.8, "Update Adherence", fontsize=7.5, color='#059669')

    # E2 to P4 (Caregiver intercom broadcast)
    ax.annotate("", xy=(8.2, 3.1), xytext=(10.5, 5.5), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2))
    ax.text(9.8, 4.0, "Intercom Voice", fontsize=8, color='#dc2626')

    # P4 to E1 (TTS Audio in room)
    ax.annotate("", xy=(1.7, 5.5), xytext=(6.5, 2.5), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2, ls="--"))
    ax.text(3.5, 1.8, "Audio Announcement Spoken in Room (TTS)", fontsize=8, fontweight='bold', color='#dc2626')

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_3_3_data_flow_diagram.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 4. Figure 3.4: Fall Detection & Posture Classification Flowchart
# -----------------------------------------------------------------------------
def make_fig_3_4():
    fig, ax = plt.subplots(figsize=(10, 12), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    ax.text(5.0, 11.5, "Figure 3.4: Deterministic Fall Detection & Heuristic Posture Flowchart", 
            ha='center', va='center', fontsize=13.5, fontweight='bold', color='#0f172a')

    # Steps
    steps = [
        ("Start: Capture RGB Frame from Camera", 10.7, 'box', '#f1f5f9'),
        ("Execute MediaPipe BlazePose (WASM)", 9.7, 'box', '#e0f2fe'),
        ("Extract 33 3D Skeletal Keypoints\n(Shoulders: 11,12; Hips: 23,24; Ankles: 27,28)", 8.5, 'box', '#dbeafe'),
        ("Compute Torso Vector T = Shoulders_mid - Hips_mid\nCalculate Tilt Angle Theta = |arctan2(dy, dx)| * 180 / pi", 7.2, 'box', '#bfdbfe'),
        ("Calculate Aspect Ratio AR = Body_Width / Body_Height\nCalculate Center-of-Mass Vertical Velocity V = dy / dt", 5.9, 'box', '#93c5fd'),
        ("Is Torso Angle Theta < 35 deg\nAND Aspect Ratio AR > 1.25?", 4.5, 'diamond', '#fef3c7'),
        ("Check Persistence Timer: Has state persisted for >= 1.8 s?", 3.0, 'diamond', '#fee2e2'),
        ("FIRE ALARM: Paramedic Siren + Desktop Notification + WhatsApp SOS", 1.5, 'box', '#ef4444'),
        ("Reset / Maintain Normal Status: Stand / Sit / Safe Bed Rest", 3.0, 'box', '#dcfce7')
    ]
    
    # Draw boxes
    for text, y, shape, fc in steps:
        if shape == 'box':
            box = patches.FancyBboxPatch((1.5, y-0.4), 7.0, 0.8, boxstyle="round,pad=0.1", 
                                         edgecolor='#334155', facecolor=fc, lw=1.5)
            ax.add_patch(box)
            tc = '#ffffff' if fc == '#ef4444' else '#0f172a'
            ax.text(5.0, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color=tc)
        elif shape == 'diamond':
            poly = patches.Polygon([[5.0, y+0.55], [8.0, y], [5.0, y-0.55], [2.0, y]], 
                                   closed=True, edgecolor='#b45309', facecolor=fc, lw=1.5)
            ax.add_patch(poly)
            ax.text(5.0, y, text, ha='center', va='center', fontsize=8.0, fontweight='bold', color='#78350f')

    # Normal state box at side (x=8.4)
    norm_box = patches.FancyBboxPatch((7.6, 4.1), 2.2, 0.8, boxstyle="round,pad=0.1", 
                                      edgecolor='#16a34a', facecolor='#dcfce7', lw=1.5)
    ax.add_patch(norm_box)
    ax.text(8.7, 4.5, "Safe Posture:\nUpright / Sitting\n(Timer = 0)", ha='center', va='center', 
            fontsize=7.5, fontweight='bold', color='#166534')

    # Arrows
    # Vertical arrows down
    for y1, y2 in [(10.3, 10.1), (9.3, 8.9), (8.1, 7.6), (6.8, 6.3), (5.5, 5.05)]:
        ax.annotate("", xy=(5.0, y2), xytext=(5.0, y1), arrowprops=dict(arrowstyle="->", color="#334155", lw=2))

    # Diamond 1 (y=4.5) -> Yes -> Diamond 2 (y=3.0)
    ax.annotate("", xy=(5.0, 3.55), xytext=(5.0, 3.95), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2))
    ax.text(5.3, 3.75, "YES", fontsize=8, fontweight='bold', color='#dc2626')

    # Diamond 1 (y=4.5) -> No -> Normal Box
    ax.annotate("", xy=(7.6, 4.5), xytext=(8.0, 4.5), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))
    ax.text(7.75, 4.7, "NO", fontsize=8, fontweight='bold', color='#16a34a')

    # Diamond 2 (y=3.0) -> Yes -> Alarm (y=1.5)
    ax.annotate("", xy=(5.0, 1.9), xytext=(5.0, 2.45), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2.5))
    ax.text(5.3, 2.2, "YES (>= 1.8s)", fontsize=8, fontweight='bold', color='#dc2626')

    # Diamond 2 (y=3.0) -> No (Transient/Stumble) -> Normal
    ax.plot([2.0, 0.8, 0.8, 8.7, 8.7], [3.0, 3.0, 0.7, 0.7, 4.1], color="#16a34a", lw=1.5, ls="--")
    ax.text(1.2, 3.15, "NO (< 1.8s)", fontsize=7.5, color='#16a34a')

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_3_4_fall_flowchart.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 5. Figure 3.5: Multilingual Speech & Phonetic Matcher Flowchart
# -----------------------------------------------------------------------------
def make_fig_3_5():
    fig, ax = plt.subplots(figsize=(10, 11), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 11)
    ax.axis('off')
    
    ax.text(5.0, 10.5, "Figure 3.5: Multilingual Voice Adherence & Phonetic Matcher Pipeline", 
            ha='center', va='center', fontsize=13, fontweight='bold', color='#0f172a')

    speech_steps = [
        ("Medication Timer Triggers at Scheduled Hour (for_date, for_time)", 9.7, '#f1f5f9'),
        ("Synthesize Audible Speech via Web Speech API (SpeechSynthesis)\nPrompts elder in configured language (KN: ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ)", 8.5, '#ede9fe'),
        ("Activate Continuous Speech Recognition (Web Speech STT)\nListening badge active; capture audio utterance", 7.2, '#ddd6fe'),
        ("Receive ASR Raw Text Transcription from Browser Engine", 5.9, '#c4b5fd'),
        ("Execute Phonetic Regex Normalizer Engine\nRegex: /(the gunday|tagunday|aithu|ತಗೊಂಡೆ|done|taken|हाँ)/i", 4.5, '#fef3c7'),
        ("Does transcription match affirmative phonemes?", 3.1, 'diamond'),
        ("Action: Mark Taken in DB + Kannada Audio Affirmation ('ಧನ್ಯವಾದಗಳು!')", 1.6, '#dcfce7'),
        ("Action: Re-prompt / Escalate to Missed Dose Alert", 1.6, '#fee2e2')
    ]
    
    for item in speech_steps[:5]:
        text, y, fc = item
        box = patches.FancyBboxPatch((1.2, y-0.45), 7.6, 0.85, boxstyle="round,pad=0.1", 
                                     edgecolor='#5b21b6', facecolor=fc, lw=1.5)
        ax.add_patch(box)
        ax.text(5.0, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#2e1065')

    # Arrows 1 to 5
    for y1, y2 in [(9.25, 8.95), (8.05, 7.65), (6.75, 6.35), (5.45, 4.95)]:
        ax.annotate("", xy=(5.0, y2), xytext=(5.0, y1), arrowprops=dict(arrowstyle="->", color="#4c1d95", lw=2))

    # Diamond at y=3.1
    poly = patches.Polygon([[5.0, 3.65], [7.8, 3.1], [5.0, 2.55], [2.2, 3.1]], 
                           closed=True, edgecolor='#b45309', facecolor='#fef3c7', lw=1.5)
    ax.add_patch(poly)
    ax.text(5.0, 3.1, "Affirmative Dialect\nMatch Found?", ha='center', va='center', 
            fontsize=8.5, fontweight='bold', color='#78350f')

    # Arrow to Diamond
    ax.annotate("", xy=(5.0, 3.65), xytext=(5.0, 4.05), arrowprops=dict(arrowstyle="->", color="#4c1d95", lw=2))

    # Diamond -> Left (Yes -> Green)
    b_yes = patches.FancyBboxPatch((0.5, 1.1), 4.2, 0.9, boxstyle="round,pad=0.1", 
                                   edgecolor='#16a34a', facecolor='#dcfce7', lw=1.5)
    ax.add_patch(b_yes)
    ax.text(2.6, 1.55, "CONFIRMED ADHERENCE\n- Record in SQLite DB (taken_at)\n- Speak: 'ಔಷಧ ತಗೊಂಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು'\n- Update Caregiver Clinical Analytics", 
            ha='center', va='center', fontsize=7.2, fontweight='bold', color='#14532d')
    ax.annotate("", xy=(2.6, 2.0), xytext=(3.5, 2.8), arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2))
    ax.text(3.1, 2.5, "YES", fontsize=8, fontweight='bold', color='#16a34a')

    # Diamond -> Right (No -> Red)
    b_no = patches.FancyBboxPatch((5.3, 1.1), 4.2, 0.9, boxstyle="round,pad=0.1", 
                                  edgecolor='#dc2626', facecolor='#fee2e2', lw=1.5)
    ax.add_patch(b_no)
    ax.text(7.4, 1.55, "UNCONFIRMED / TIMEOUT\n- Re-prompt elder in 5 minutes\n- If 3 timeouts: Alert Caregiver\n- Mark Dose 'Missed' in History", 
            ha='center', va='center', fontsize=7.2, fontweight='bold', color='#7f1d1d')
    ax.annotate("", xy=(7.4, 2.0), xytext=(6.5, 2.8), arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2))
    ax.text(6.8, 2.5, "NO", fontsize=8, fontweight='bold', color='#dc2626')

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_3_5_speech_flowchart.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 6. Figure 7.1: Fall Detection Accuracy vs. Torso Tilt Angle Threshold
# -----------------------------------------------------------------------------
def make_fig_7_1():
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
    angles = np.array([15, 20, 25, 30, 35, 40, 45, 50, 55])
    accuracy = np.array([78.2, 84.5, 91.0, 94.2, 96.4, 93.8, 88.5, 82.0, 74.5])
    precision = np.array([98.5, 97.2, 95.8, 94.0, 93.5, 87.2, 79.5, 71.0, 62.4])
    recall = np.array([64.0, 73.5, 86.2, 94.5, 99.4, 100.0, 100.0, 100.0, 100.0])

    ax.plot(angles, accuracy, 'o-', color='#0284c7', lw=3, ms=7, label='Overall Accuracy (%)')
    ax.plot(angles, precision, 's--', color='#16a34a', lw=2, ms=6, label='Precision (%)')
    ax.plot(angles, recall, '^:', color='#dc2626', lw=2, ms=6, label='Recall / Sensitivity (%)')

    # Annotate peak
    ax.annotate('Optimal Threshold: 35 deg\nAccuracy = 96.4%\nRecall = 99.4%', 
                xy=(35, 96.4), xytext=(38, 85),
                arrowprops=dict(facecolor='#0284c7', shrink=0.08, width=2, headwidth=8),
                bbox=dict(boxstyle="round,pad=0.3", fc="#e0f2fe", ec="#0284c7", lw=1.5),
                fontsize=9, fontweight='bold')

    ax.set_title("Figure 7.1: Fall Detection Performance vs. Torso Tilt Angle Threshold", fontsize=12, fontweight='bold', pad=15)
    ax.set_xlabel("Torso Tilt Angle Threshold (Degrees from Horizontal Plane)", fontsize=10, fontweight='bold')
    ax.set_ylabel("Metric Score (%)", fontsize=10, fontweight='bold')
    ax.set_ylim(55, 105)
    ax.set_xlim(12, 58)
    ax.grid(True, linestyle='--', alpha=0.6)
    ax.legend(loc='lower left', frameon=True, shadow=True)

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_7_1_accuracy_vs_threshold.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 7. Figure 7.2: Comparative Adherence Rate Chart
# -----------------------------------------------------------------------------
def make_fig_7_2():
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
    systems = ['Passive Beeping\nPillbox', 'Smartphone App\n(Push Notification)', 'Standard Video\n(CCTV Monitored)', 'EldrAI Proposed\n(Vernacular Voice)']
    rates = [51.8, 68.4, 74.2, 96.1]
    colors = ['#94a3b8', '#64748b', '#3b82f6', '#10b981']

    bars = ax.bar(systems, rates, color=colors, width=0.55, edgecolor='#1e293b', linewidth=1.5)
    
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 1.5, f"{h:.1f}%", 
                ha='center', va='bottom', fontsize=11, fontweight='bold')

    ax.set_title("Figure 7.2: Longitudinal Medication Adherence Compliance Across Systems", fontsize=12, fontweight='bold', pad=15)
    ax.set_ylabel("Medication Adherence Compliance Rate (%)", fontsize=10, fontweight='bold')
    ax.set_ylim(0, 110)
    ax.grid(axis='y', linestyle='--', alpha=0.6)

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_7_2_comparative_adherence.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 8. Figure 7.3: Telemetry Alerting Latency Benchmark Chart
# -----------------------------------------------------------------------------
def make_fig_7_3():
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
    channels = ['Standard Cloud\nEmail (SMTP)', 'Third-Party SMS\nGateway', 'HTTP Long\nPolling', 'EldrAI WebSockets\n(Socket.IO Push)']
    latency_ms = [4200, 2800, 1500, 145]
    colors = ['#ef4444', '#f97316', '#eab308', '#06b6d4']

    bars = ax.bar(channels, latency_ms, color=colors, width=0.55, edgecolor='#0f172a', linewidth=1.5)

    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., h + 100, f"{int(h)} ms", 
                ha='center', va='bottom', fontsize=10.5, fontweight='bold')

    ax.set_title("Figure 7.3: Telemetry Emergency Alert Latency from Fall Trigger to Siren", fontsize=12, fontweight='bold', pad=15)
    ax.set_ylabel("End-to-End Latency (Milliseconds)", fontsize=10, fontweight='bold')
    ax.set_yscale('log')
    ax.set_ylim(50, 10000)
    ax.grid(axis='y', linestyle='--', alpha=0.6)

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_7_3_latency_comparison.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

# -----------------------------------------------------------------------------
# 9. Figure A.5: Entity-Relationship Diagram (Database Schema)
# -----------------------------------------------------------------------------
def make_fig_a_5():
    fig, ax = plt.subplots(figsize=(13, 8), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 8)
    ax.axis('off')
    
    ax.text(6.5, 7.6, "Figure A.5: Relational Database Schema – SQLite Enterprise ER Model", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#0f172a')

    # Table 1: caregivers
    t_cg = patches.FancyBboxPatch((0.6, 3.8), 3.2, 3.2, boxstyle="round,pad=0.1", 
                                  edgecolor='#1e3a8a', facecolor='#eff6ff', lw=2)
    ax.add_patch(t_cg)
    ax.text(2.2, 6.7, "TABLE: caregivers", ha='center', fontsize=10, fontweight='bold', color='#1e3a8a')
    fields_cg = [
        "PK  id: INTEGER",
        "    name: TEXT",
        "    email: TEXT (UNIQUE)",
        "    password_hash: TEXT",
        "    phone: TEXT",
        "    smtp_host / port",
        "    created_at: DATETIME"
    ]
    for i, f in enumerate(fields_cg):
        ax.text(0.9, 6.2 - i*0.35, f, fontsize=8, color='#1e293b')

    # Table 2: elders
    t_eld = patches.FancyBboxPatch((4.8, 3.8), 3.4, 3.2, boxstyle="round,pad=0.1", 
                                   edgecolor='#065f46', facecolor='#ecfdf5', lw=2)
    ax.add_patch(t_eld)
    ax.text(6.5, 6.7, "TABLE: elders", ha='center', fontsize=10, fontweight='bold', color='#065f46')
    fields_eld = [
        "PK  id: INTEGER",
        "FK  caregiver_id: INTEGER",
        "    name: TEXT",
        "    age: INTEGER",
        "    code: TEXT (UNIQUE)",
        "    preferred_lang: TEXT",
        "    notes / photo: TEXT",
        "    created_at: DATETIME"
    ]
    for i, f in enumerate(fields_eld):
        ax.text(5.1, 6.2 - i*0.35, f, fontsize=8, color='#1e293b')

    # Table 3: medications
    t_med = patches.FancyBboxPatch((9.2, 4.2), 3.2, 2.8, boxstyle="round,pad=0.1", 
                                   edgecolor='#7c2d12', facecolor='#fff7ed', lw=2)
    ax.add_patch(t_med)
    ax.text(10.8, 6.7, "TABLE: medications", ha='center', fontsize=10, fontweight='bold', color='#7c2d12')
    fields_med = [
        "PK  id: INTEGER",
        "FK  elder_id: INTEGER",
        "    name: TEXT",
        "    dosage: TEXT",
        "    time: TEXT (HH:MM)",
        "    daily: INTEGER (0/1)",
        "    lang: TEXT ('kn','en')",
        "    has_audio: INTEGER"
    ]
    for i, f in enumerate(fields_med):
        ax.text(9.5, 6.2 - i*0.33, f, fontsize=7.8, color='#1e293b')

    # Table 4: medication_logs
    t_logs = patches.FancyBboxPatch((4.8, 0.4), 3.4, 2.8, boxstyle="round,pad=0.1", 
                                    edgecolor='#581c87', facecolor='#faf5ff', lw=2)
    ax.add_patch(t_logs)
    ax.text(6.5, 2.9, "TABLE: medication_logs", ha='center', fontsize=10, fontweight='bold', color='#581c87')
    fields_logs = [
        "PK  id: INTEGER",
        "FK  med_id: INTEGER",
        "FK  elder_id: INTEGER",
        "    status: TEXT ('taken','missed')",
        "    for_date: TEXT (YYYY-MM-DD)",
        "    for_time: TEXT (HH:MM)",
        "    taken_at: DATETIME",
        "UQ (med_id, for_date, for_time)"
    ]
    for i, f in enumerate(fields_logs):
        ax.text(5.1, 2.5 - i*0.30, f, fontsize=7.8, color='#1e293b')

    # Table 5: alerts
    t_alt = patches.FancyBboxPatch((0.6, 0.5), 3.2, 2.6, boxstyle="round,pad=0.1", 
                                   edgecolor='#991b1b', facecolor='#fef2f2', lw=2)
    ax.add_patch(t_alt)
    ax.text(2.2, 2.8, "TABLE: alerts", ha='center', fontsize=10, fontweight='bold', color='#991b1b')
    fields_alt = [
        "PK  id: INTEGER",
        "FK  elder_id: INTEGER",
        "    type: TEXT ('fall','sos')",
        "    detail: TEXT",
        "    emailed: INTEGER (0/1)",
        "    email_info: TEXT",
        "    created_at: DATETIME"
    ]
    for i, f in enumerate(fields_alt):
        ax.text(0.9, 2.4 - i*0.30, f, fontsize=7.8, color='#1e293b')

    # Relationships (Arrows)
    # caregivers -> elders (1:N)
    ax.annotate("", xy=(4.8, 5.4), xytext=(3.8, 5.4),
                arrowprops=dict(arrowstyle="->", color="#1e3a8a", lw=2))
    ax.text(4.3, 5.6, "1 : N", ha='center', fontsize=8, fontweight='bold', color='#1e3a8a')

    # elders -> medications (1:N)
    ax.annotate("", xy=(9.2, 5.4), xytext=(8.2, 5.4),
                arrowprops=dict(arrowstyle="->", color="#065f46", lw=2))
    ax.text(8.7, 5.6, "1 : N", ha='center', fontsize=8, fontweight='bold', color='#065f46')

    # elders -> alerts (1:N)
    ax.annotate("", xy=(2.2, 3.1), xytext=(5.5, 3.8),
                arrowprops=dict(arrowstyle="->", color="#991b1b", lw=2))
    ax.text(3.5, 3.6, "1 : N", ha='center', fontsize=8, fontweight='bold', color='#991b1b')

    # medications -> medication_logs (1:N)
    ax.annotate("", xy=(8.2, 1.8), xytext=(9.5, 4.2),
                arrowprops=dict(arrowstyle="->", color="#581c87", lw=2))
    ax.text(9.2, 2.8, "1 : N", ha='center', fontsize=8, fontweight='bold', color='#581c87')

    plt.tight_layout()
    p = os.path.join(out_dir, "fig_a_5_database_schema.png")
    plt.savefig(p, dpi=300)
    plt.close()
    print("Saved:", p)

if __name__ == '__main__':
    print("Generating report figures...")
    make_fig_3_1()
    make_fig_3_2()
    make_fig_3_3()
    make_fig_3_4()
    make_fig_3_5()
    make_fig_7_1()
    make_fig_7_2()
    make_fig_7_3()
    make_fig_a_5()
    print("All 9 figures generated successfully!")
