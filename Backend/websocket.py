# websocket.py
import json
import time
from datetime import datetime
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect
import jwt
from database import SessionLocal
from models import Telemetry
from auth import SECRET, ALGO
from models import User

# ML imports
import cv2
from ml.proctor import ProctorEngine
from ml.confusion import get_confusion_state
import base64
import numpy as np

# --- In-memory connections & last telemetry ---
students_ws: Dict[str, WebSocket] = {}
teachers_ws: List[WebSocket] = []

# Store last 10 confusion scores per student for smoothing
confusion_history: Dict[str, List[float]] = {}

# Initialize ML engine
proctor = ProctorEngine()


# --- Helper: decode base64 to OpenCV image ---
def decode_base64_to_cv2(b64_string):
    if not b64_string:
        return None
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",")[1]
        img_bytes = base64.b64decode(b64_string)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        print("⚠️ Failed to decode frame:", e)
        return None


# -------- STUDENT SOCKET --------
async def student_ws(websocket: WebSocket):
    await websocket.accept()

    # --- Authenticate ---
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close()
        return

    try:
        user = jwt.decode(token, SECRET, algorithms=[ALGO])
        if user["role"] != "student":
            await websocket.close()
            return
    except Exception:
        await websocket.close()
        return
    
    db = SessionLocal()   # ✅ CREATE DB FIRST

    student_id = user["user_id"]

    student = db.query(User).filter(User.id == student_id).first()
    student_name = student.name if student else f"Student {student_id}"

    students_ws[student_id] = websocket
    confusion_history.setdefault(student_id, [])

    print(f"✅ Student {student_id} connected.")

    try:
        while True:
            # inside while True:

            data = await websocket.receive_json()
            frame_data = data.get("frame")

            frame = decode_base64_to_cv2(frame_data)

            # ---------- PROCESS FRAME ----------
            if frame is None:
                proctor_data = {
                    "face_count": 0,
                    "status": "NO FRAME",
                    "emotion": "Unknown",
                    "landmarks": [],
                    "happy_prob": 0.0,
                    "gaze": "CENTER"
                }
            else:
                proctor_data = proctor.process_frame(frame)

            # ---------- CONFUSION ----------
            try:
                confused_flag, raw_confusion_score = get_confusion_state(
                    proctor_data["landmarks"],
                    proctor_data["happy_prob"]
                )
                
            except Exception as e:
                print("⚠️ confusion error:", e)
                confused_flag = False
                raw_confusion_score = 0.0

            # ---------- SMOOTH ----------
            history = confusion_history[student_id]
            history.append(raw_confusion_score)
            if len(history) > 8:
                history.pop(0)

            smoothed_confusion = sum(history) / len(history)

            # ---------- TELEMETRY ----------
            telemetry = {
                "student_id": student_id,
                "student_name": student_name, 
                "face_count": proctor_data["face_count"],
                "gaze": proctor_data["gaze"],
                "emotion": proctor_data["emotion"],
                "confusion_score": raw_confusion_score,
                "smoothed_confusion": smoothed_confusion, 
                "confused": confused_flag,
                "confusion_threshold": 0.58,
                "timestamp": int(time.time() * 1000)
            }

            # ---------- DEBUG PRINT ----------
            print("📡 Telemetry:", telemetry)

            # ---------- SAVE ----------
            t = Telemetry(
                student_id=student_id,
                face_count=telemetry["face_count"],
                gaze_direction=telemetry["gaze"],
                emotion=telemetry["emotion"],
                confused=telemetry["confused"],
                confusion_score=telemetry["confusion_score"],
                timestamp=datetime.fromtimestamp(telemetry["timestamp"] / 1000),
            )
            db.add(t)
            db.commit()

            # ---------- SEND TO TEACHERS ----------
            packet = {
                "type": "telemetry",
                "student_id": student_id,
                "student_name": student_name, 
                "data": telemetry

            }

            for ws in teachers_ws[:]:
                try:
                    await ws.send_json(packet)
                except:
                    teachers_ws.remove(ws)

    except WebSocketDisconnect:
        print(f"❌ Student {student_id} disconnected")
        students_ws.pop(student_id, None)
        confusion_history.pop(student_id, None)
    finally:
        db.close()


# -------- TEACHER SOCKET --------
async def teacher_ws(websocket: WebSocket):
    await websocket.accept()
    token = websocket.cookies.get("access_token")
    if not token:
        await websocket.close()
        return

    try:
        user = jwt.decode(token, SECRET, algorithms=[ALGO])
        if user["role"] != "teacher":
            await websocket.close()
            return
    except Exception:
        await websocket.close()
        return

    teachers_ws.append(websocket)
    print(f"✅ Teacher connected. Total: {len(teachers_ws)}")

    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        teachers_ws.remove(websocket)
        print(f"❌ Teacher disconnected. Total: {len(teachers_ws)}")
