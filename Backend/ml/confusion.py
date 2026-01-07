# ml/confusion.py
import numpy as np

def dist(a, b):
    return np.linalg.norm(np.array(a) - np.array(b))


def get_confusion_state(landmarks, happy_prob):
    try:
        if not landmarks or len(landmarks) < 455:
            return False, 0.0

        # Eyes for scale
        L_eye = landmarks[133]
        R_eye = landmarks[362]
        face_scale = dist((L_eye.x, L_eye.y), (R_eye.x, R_eye.y))
        if face_scale == 0:
            return False, 0.0

        # Brows
        L_brow = landmarks[70]
        R_brow = landmarks[300]
        brow_dist = dist((L_brow.x, L_brow.y), (R_brow.x, R_brow.y)) / face_scale

        # Head tilt
        L_ear = landmarks[234]
        R_ear = landmarks[454]
        tilt = abs(L_ear.y - R_ear.y) / face_scale

        # ---- Normalization tuned for MediaPipe ----
        # Example: if raw brow_dist ~ 3 normally
        brow_norm = min(brow_dist / 3.5, 1.0)
        tilt_norm = min(tilt / 0.12, 1.0)  # maybe tune later too

        happy_norm = max(0.0, min(happy_prob, 1.0))

        # ---- Confusion score ----
        confusion_score = (
            0.45 * (1 - brow_norm) +
            0.35 * (1 - happy_norm) +
            0.20 * tilt_norm
        )

        confusion_score = max(0.0, min(confusion_score, 1.0))
        confusion_score = float(confusion_score)  # ensure type
        
        confused = confusion_score >= 0.58

        print("DEBUG →", confusion_score, confused, type(confusion_score))
        # print(f"raw brow={brow_dist:.3f} tilt={tilt:.3f} happy={happy_prob:.2f} "f"→ norm brow={brow_norm:.3f} tilt={tilt_norm:.3f} happy={happy_norm:.2f} ""→ confusion={confusion_score:.2f}")


        return confused, confusion_score

    except Exception as e:
        print("⚠️ get_confusion_state error:", e)
        return False, 0.0
