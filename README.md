# SmartSession_AI
“An AI-driven classroom assistant that helps teachers understand when students are confused, distracted, or off-screen — without being invasive — using live video analytics and WebSockets.”


# 🧠 SmartSession — Real-Time Student Engagement & Proctoring System

SmartSession is a real-time AI-powered web system that analyzes a student’s webcam feed to detect:

✅ Confusion  
✅ Engagement level  
✅ Proctoring / integrity risks  

The teacher dashboard receives telemetry instantly and shows live student status.

This project was built for the **nSkills SmartSession Selection Challenge**.

---

## 🎯 Objective

SmartSession is designed to help teachers understand:

✔ When a student is confused  
✔ Whether the student is attentive  
✔ Whether multiple people or suspicious behavior is detected  

The goal is **support — not policing.**

---

## 📌 Features

### 🎓 Student Portal
- Captures webcam feed
- Runs ML analysis
- Detects:
  - Confusion
  - Gaze direction
  - Missing face
  - Multiple faces
- Sends telemetry via **WebSockets**

---

### 👨‍🏫 Teacher Dashboard
- Shows **real-time student status**
- Status colors:
  - 🟢 Focused
  - 🟡 Confused
  - 🔴 Proctor Alert
- Live timeline graph
- Zero-refresh updates

---

### 🤖 AI / ML Engine (Python)
Uses:

- MediaPipe Face Mesh  
- MediaPipe Face Detection  
- OpenCV  
- FER emotion model  
- Custom confusion-score logic  
- Time-based gaze tracking  

---

## 🏗 System Architecture

```
Student Frontend → WebSocket → FastAPI Backend → ML Engine
                                            ↓
                                  Teacher Dashboard
```

WebSockets are used for **low-latency live telemetry.**

---

## 📂 Project Structure

```
smartsession/
 ├── Backend/
 │   ├── main.py
 │   ├── websocket.py
 │   ├── report.py
 │   ├── models.py
 │   ├── schemas.py
 │   ├── database.py
 │   ├── requirements.txt
 │   └── ml/
 │       ├── confusion.py
 │       └── proctor.py
 │
 ├── Frontend/
 │   ├── pages/
 │   ├── components/
 │   ├── styles/
 │   ├── api.js
 │   ├── package.json
 │   └── package-lock.json
 │
 ├── README.md
 └── .gitignore
```

---

# ⚙️ Backend Setup — FastAPI

### Create virtual environment
```bash
cd Backend
python -m venv venv
```

Activate:

Windows:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

---

### Install dependencies
```bash
pip install -r requirements.txt
```

---

### Run backend
```bash
uvicorn main:app --reload
```

Backend runs at:
```
http://localhost:8000
```

---

# 🎨 Frontend Setup — Next.js / React

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs at:
```
http://localhost:3000
```

---

# 🧠 AI / ML Engine — How Detection Works

The ML engine performs:

✔ Face detection  
✔ Gaze direction estimation  
✔ Emotion probability extraction  
✔ Custom confusion-score calculation  
✔ Time-based proctor checks  

---

## 🧩 Confusion Detection — My Custom Logic

Confusion is **not directly predicted by FER.**  
So I implemented a **confusion-score** combining three signals:

| Signal | Source | Meaning |
|--------|--------|--------|
| Eyebrow contraction | MediaPipe Face Mesh | Cognitive strain |
| Happiness probability | FER | Emotional tone |
| Head tilt | Landmark symmetry | Uncertainty posture |

Implementation:

```
Backend/ml/confusion.py
```

---

### 🎯 Landmarks Used

| ID | Use |
|----|----|
| 133 / 362 | Eye centers (scale reference) |
| 70 / 300 | Inner eyebrows (brow contraction) |
| 234 / 454 | Ear height (tilt detection) |

Eye-to-eye distance is used for **scale normalization** so results don’t change with camera distance.

---

## 🧮 Confusion Score Formula

```python
confusion_score = (
    0.45 * (1 - brow_norm) +
    0.35 * (1 - happy_norm) +
    0.20 * tilt_norm
)
```

Where:

### ✔ `brow_norm`

```
brow_norm = brow_dist / 3.5
```

Lower spacing → higher confusion.

Converted to confusion weight:

```
1 - brow_norm
```

---

### ✔ `happy_norm`

```
happy_norm = clamp(happy_prob, 0..1)
```

Lower happiness → higher confusion-weight.

---

### ✔ `tilt_norm`

```
tilt_norm = abs(L_ear.y - R_ear.y) / face_scale
```

---

## 🎯 Final Decision Rule

```python
confused = confusion_score >= 0.58
```

| Score | Meaning |
|------|--------|
| 0.00 – 0.30 | Confident |
| 0.30 – 0.57 | Neutral |
| ≥ 0.58 | **Confused** |

Function returns:

```
confused: bool
confusion_score: float (0–1)
```

This makes confusion **explainable and deterministic.**

---

# 🛡 Proctoring & Integrity Detection

Implementation:

```
Backend/ml/proctor.py
```

Uses:

✔ MediaPipe Face Detection → face count  
✔ MediaPipe Face Mesh → gaze  
✔ FER → emotional cues  
✔ Timer logic → prevents false alerts  

---

## 👥 Face Count Rules

| Condition | Status |
|----------|-------|
| 0 faces | `NO PERSON` |
| >1 face | `MULTIPLE PEOPLE` |
| 1 face | `OK` |

---

## 👁 Gaze Direction Detection

Computed using **nose vs eye-center offset**:

```
RIGHT  → yaw >  0.05
LEFT   → yaw < -0.05
DOWN   → pitch > 0.05
UP     → pitch < -0.05
CENTER → otherwise
```

---

## ⏳ 4-Second Gaze Violation

If gaze ≠ center:

✔ Start timer  
✔ If still away after **4 seconds → Proctor Alert**  
✔ Reset on return  

This avoids false alerts from quick glances.

---

## 🙂 Emotion Classification (FER)

| Rule | Meaning |
|------|--------|
| happy > 0.35 | Happy / Engaged |
| neutral > 0.45 | Focused / Neutral |
| else | Confused |

This label is **supportive only** — the confusion score is primary.

---

# 📡 Output JSON Per Frame

```json
{
  "face_count": 1,
  "status": "OK",
  "emotion": "Focused / Neutral",
  "happy_prob": 0.42,
  "gaze": "CENTER",
  "confused": true,
  "confusion_score": 0.67
}
```

---

# 🧪 Edge Cases Handled

✔ No face  
✔ Multiple faces  
✔ Lighting changes  
✔ Camera disconnect  
✔ Network loss  
✔ FER errors gracefully handled  

---

# 📊 Teacher Dashboard

Shows:

🟢 Focused  
🟡 Confused  
🔴 Proctor Alert  

Plus a live timeline.

---

# 🚀 Run Everything

Backend:

```bash
cd Backend
uvicorn main:app --reload
```

Frontend:

```bash
cd Frontend
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🔮 Future Enhancements

🔹 Multi-student dashboard  
🔹 Audio sentiment  
🔹 Adaptive learning feedback  
🔹 Enhanced emotion fusion  

---

# ✅ Submission Checklist

✔ WebSockets used  
✔ Custom confusion logic  
✔ Proctor alerts  
✔ Dashboard UI  
✔ README + requirements  
✔ Demo video explaining logic  

