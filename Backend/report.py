# report.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Telemetry, User
from database import get_db
from datetime import datetime

router = APIRouter(
    prefix="/report",
    tags=["report"]
)

# --- Utility to summarize telemetry ---
def summarize_telemetry(telemetry_rows: List[Telemetry]):
    if not telemetry_rows:
        return {
            "summary": {"confused_pct": 0, "happy_pct": 0, "focused_pct": 0},
            "timeline": []
        }

    total = len(telemetry_rows)
    confused = sum(1 for t in telemetry_rows if t.confused)
    happy = sum(1 for t in telemetry_rows if t.emotion in ["Happy / Excited", "Happy / Engaged"])
    focused = sum(1 for t in telemetry_rows if t.emotion in ["Focused / Neutral"])

    summary = {
        "confused_pct": round((confused / total) * 100),
        "happy_pct": round((happy / total) * 100),
        "focused_pct": round((focused / total) * 100)
    }

    timeline = [
        {
            "timestamp": t.timestamp.isoformat(),  # string ✅
            "smoothed_confusion": t.confusion_score,  # renamed for frontend
            "emotion": str(t.emotion or ""),         # always string ✅
            "face_count": t.face_count,
            "gaze": t.gaze_direction,
            "happy_prob": getattr(t, "happy_prob", 0.0)
        }
        for t in telemetry_rows
    ]

    return {"summary": summary, "timeline": timeline}


# --- GET report for a single student ---
@router.get("/student/{student_id}")
def get_student_report(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    telemetry_rows = (
        db.query(Telemetry)
        .filter(Telemetry.student_id == student_id)
        .order_by(Telemetry.timestamp)
        .all()
    )

    result = summarize_telemetry(telemetry_rows)

    # ✅ Attach student info
    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "role": student.role
        },
        "summary": result["summary"],
        "timeline": result["timeline"]
    }
