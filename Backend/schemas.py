# from pydantic import BaseModel, field_validator
# from typing import Optional
# from datetime import datetime

# class UserCreate(BaseModel):
#     name: str
#     email: str
#     password: str
#     role: str  # student / teacher
    
#     @field_validator("password")
#     def truncate_password(cls, v):
#         if not isinstance(v, str):
#             raise ValueError("Password must be a string")
#         return v[:72]
    
# class UserOut(BaseModel):
#     id: int
#     email: str
#     role: str

#     class Config:
#         orm_mode = True

# class TelemetryIn(BaseModel):
#     student_id: str
#     timestamp: int
#     face_count: int
#     gaze_direction: str
#     gaze_violation: bool
#     emotion: str
#     confused: bool
#     confusion_score: float
#     head_tilt: float
#     brow_metric: float
#     happy_prob: float

# class TelemetryOut(TelemetryIn):
#     db_id: int
#     created_at: datetime

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str  # student / teacher

class UserOut(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        orm_mode = True

class TelemetryIn(BaseModel):
    student_id: str
    timestamp: int
    face_count: int
    gaze_direction: str
    gaze_violation: bool
    emotion: str
    confused: bool
    confusion_score: float
    head_tilt: float
    brow_metric: float
    happy_prob: float

class TelemetryOut(TelemetryIn):
    db_id: int
    created_at: datetime
