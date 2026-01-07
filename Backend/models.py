from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String)  # "student" or "teacher"

    telemetry = relationship("Telemetry", back_populates="student")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    face_count = Column(Integer)
    gaze_direction = Column(String)
    gaze_violation = Column(Boolean)
    emotion = Column(String)
    confused = Column(Boolean)
    confusion_score = Column(Float)
    head_tilt = Column(Float)
    brow_metric = Column(Float)
    happy_prob = Column(Float)

    student = relationship("User", back_populates="telemetry")
