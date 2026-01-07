
# ml/proctor.py
import cv2
import mediapipe as mp
import time
from fer import FER

# MediaPipe models
mp_face = mp.solutions.face_detection
mp_mesh = mp.solutions.face_mesh

emotion_detector = FER(mtcnn=True)

VIOLATION_TIME = 4  # seconds for looking away


def classify_direction(nose, left_eye, right_eye):
    yaw = nose[0] - ((left_eye[0] + right_eye[0]) / 2)
    pitch = nose[1] - ((left_eye[1] + right_eye[1]) / 2)

    if yaw > 0.05: return "RIGHT"
    if yaw < -0.05: return "LEFT"
    if pitch > 0.05: return "DOWN"
    if pitch < -0.05: return "UP"
    return "CENTER"


class ProctorEngine:
    def __init__(self):
        self.yaw_state = None
        self.yaw_start_time = None
        self.face_detector = mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.6)
        self.mesh = mp_mesh.FaceMesh(refine_landmarks=True)

    def process_frame(self, frame):
        if frame is None:
            return {
                "face_count": 0,
                "status": "NO FRAME",
                "emotion": "Unknown",
                "landmarks": [],
                "happy_prob": 0.0,
                "gaze": "CENTER"
            }

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # ---------- FACE COUNT ----------
        face_results = self.face_detector.process(rgb)
        face_count = 0 if not face_results.detections else len(face_results.detections)

        status = "OK"
        if face_count == 0:
            status = "NO PERSON"
        elif face_count > 1:
            status = "MULTIPLE PEOPLE"

        # ---------- LANDMARKS & GAZE ----------
        landmarks = []
        gaze = "CENTER"

        mesh_results = self.mesh.process(rgb)
        if mesh_results.multi_face_landmarks:
            lm = mesh_results.multi_face_landmarks[0].landmark
            landmarks = lm

            nose = (lm[1].x, lm[1].y)
            left_eye = (lm[33].x, lm[33].y)
            right_eye = (lm[263].x, lm[263].y)

            gaze = classify_direction(nose, left_eye, right_eye)

            # Gaze violation timer
            if gaze != "CENTER":
                if self.yaw_state != gaze:
                    self.yaw_state = gaze
                    self.yaw_start_time = time.time()
                else:
                    if time.time() - self.yaw_start_time > VIOLATION_TIME:
                        status = f"LOOKING {gaze}"
            else:
                self.yaw_state = None
                self.yaw_start_time = None

        # ---------- EMOTION ----------
        happy_prob = 0.0
        emotion_label = "Unknown"

        try:
            emotions = emotion_detector.detect_emotions(frame)
            if emotions:
                emo = emotions[0]["emotions"]
                happy_prob = float(emo.get("happy", 0.0))
                neutral_prob = float(emo.get("neutral", 0.0))

                # Normalize if FER returns 0-100
                if happy_prob > 1: happy_prob /= 100.0
                if neutral_prob > 1: neutral_prob /= 100.0

                if happy_prob > 0.35:
                    emotion_label = "Happy / Engaged"
                elif neutral_prob > 0.45:
                    emotion_label = "Focused / Neutral"
                else:
                    emotion_label = "Confused"
        except Exception as e:
            print("⚠️ FER error:", e)

        return {
            "face_count": face_count,
            "status": status,
            "emotion": emotion_label,
            "landmarks": landmarks,
            "happy_prob": happy_prob,
            "gaze": gaze
        }
