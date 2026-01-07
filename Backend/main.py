# # import os

# # from fastapi import FastAPI, Depends, Form, Response, HTTPException, Request, WebSocket
# # from fastapi.middleware.cors import CORSMiddleware
# # from sqlalchemy.orm import Session

# # from passlib.context import CryptContext

# # from database import Base, engine, SessionLocal
# # from models import User
# # from schemas import UserCreate
# # from auth import create_token, get_user_from_cookie
# # from websocket import student_ws, teacher_ws

# # # ------------------ Setup ------------------

# # # Create DB tables
# # Base.metadata.create_all(bind=engine)

# # # Password hashing (NO LENGTH LIMIT)
# # pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# # def hash_password(password: str) -> str:
# #     return pwd_context.hash(password)

# # def verify_password(password: str, hash_: str) -> bool:
# #     return pwd_context.verify(password, hash_)

# # # ------------------ FastAPI app ------------------

# # app = FastAPI()

# # # ------------------ CORS ------------------

# # frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=[frontend_url],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # ------------------ DB Dependency ------------------

# # def get_db():
# #     db = SessionLocal()
# #     try:
# #         yield db
# #     finally:
# #         db.close()

# # # ------------------ Routes ------------------

# # @app.get("/")
# # def home():
# #     return {"msg": "backend running"}

# # # -------- REGISTER --------
# # @app.post("/register")
# # def register(user: UserCreate, db: Session = Depends(get_db)):
# #     if user.role not in ["student", "teacher"]:
# #         raise HTTPException(status_code=400, detail="Invalid role")

# #     existing = db.query(User).filter(User.email == user.email).first()
# #     if existing:
# #         raise HTTPException(status_code=400, detail="Email already registered")

# #     new_user = User(
# #         email=user.email,
# #         password_hash=hash_password(user.password),
# #         role=user.role
# #     )

# #     db.add(new_user)
# #     db.commit()
# #     db.refresh(new_user)

# #     return {"message": "User registered successfully"}

# # # -------- LOGIN --------
# # @app.post("/login")
# # def login(
# #     response: Response,
# #     username: str = Form(...),
# #     password: str = Form(...),
# #     db: Session = Depends(get_db)
# # ):
# #     user = db.query(User).filter(User.email == username).first()

# #     if not user or not verify_password(password, user.password_hash):
# #         raise HTTPException(status_code=401, detail="Invalid credentials")

# #     token = create_token(user.id, user.role)

# #     response.set_cookie(
# #         key="access_token",
# #         value=token,
# #         httponly=True,
# #         samesite="lax"
# #     )

# #     return {"message": "ok"}

# # # -------- ME --------
# # @app.get("/me")
# # def me(request: Request):
# #     return get_user_from_cookie(request)

# # # -------- LOGOUT --------
# # @app.post("/logout")
# # def logout(response: Response):
# #     response.delete_cookie("access_token")
# #     return {"message": "logged out"}

# # # -------- WEBSOCKETS --------
# # @app.websocket("/ws/student")
# # async def ws_student(ws: WebSocket):
# #     await student_ws(ws)

# # @app.websocket("/ws/teacher")
# # async def ws_teacher(ws: WebSocket):
# #     await teacher_ws(ws)


# import os
# from typing import List

# from fastapi import FastAPI, Depends, Form, Response, HTTPException, Request, WebSocket, WebSocketDisconnect
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# from passlib.context import CryptContext

# from database import Base, engine, SessionLocal
# from models import User
# from schemas import UserCreate
# from auth import create_token, get_user_from_cookie

# # ------------------ Setup ------------------
# Base.metadata.create_all(bind=engine)

# pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(password: str, hash_: str) -> bool:
#     return pwd_context.verify(password, hash_)

# # ------------------ FastAPI app ------------------
# app = FastAPI()

# # ------------------ CORS ------------------
# frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[frontend_url],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ------------------ DB Dependency ------------------
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ------------------ Routes ------------------
# @app.get("/")
# def home():
#     return {"msg": "backend running"}

# @app.post("/register")
# def register(user: UserCreate, db: Session = Depends(get_db)):
#     if user.role not in ["student", "teacher"]:
#         raise HTTPException(status_code=400, detail="Invalid role")

#     existing = db.query(User).filter(User.email == user.email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     new_user = User(
#         email=user.email,
#         password_hash=hash_password(user.password),
#         role=user.role
#     )

#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)

#     return {"message": "User registered successfully"}

# @app.post("/login")
# def login(
#     response: Response,
#     username: str = Form(...),
#     password: str = Form(...),
#     db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(User.email == username).first()
#     if not user or not verify_password(password, user.password_hash):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     token = create_token(user.id, user.role)
#     response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
#     return {"message": "ok"}

# @app.get("/me")
# def me(request: Request):
#     return get_user_from_cookie(request)

# @app.post("/logout")
# def logout(response: Response):
#     response.delete_cookie("access_token")
#     return {"message": "logged out"}

# # ======================================================
# # =============== 🔥 WEBSOCKET SYSTEM 🔥 =================
# # ======================================================
# class ConnectionManager:
#     def __init__(self):
#         self.teacher_connections: List[WebSocket] = []

#     async def connect_teacher(self, websocket: WebSocket):
#         await websocket.accept()
#         self.teacher_connections.append(websocket)
#         print("✅ Teacher connected. Total:", len(self.teacher_connections))

#     def disconnect_teacher(self, websocket: WebSocket):
#         if websocket in self.teacher_connections:
#             self.teacher_connections.remove(websocket)
#             print("❌ Teacher disconnected. Total:", len(self.teacher_connections))

#     async def broadcast_to_teachers(self, data: dict):
#         print("📡 Broadcasting to", len(self.teacher_connections), "teachers")
#         for ws in self.teacher_connections:
#             try:
#                 await ws.send_json(data)
#             except:
#                 pass

# manager = ConnectionManager()

# @app.websocket("/ws/student")
# async def ws_student(websocket: WebSocket):
#     await websocket.accept()
#     print("🎥 Student connected")
#     try:
#         while True:
#             data = await websocket.receive_json()
#             print("📥 Received telemetry:", data)
#             await manager.broadcast_to_teachers(data)
#     except WebSocketDisconnect:
#         print("❌ Student disconnected")

# @app.websocket("/ws/teacher")
# async def ws_teacher(websocket: WebSocket):
#     await manager.connect_teacher(websocket)
#     try:
#         while True:
#             await websocket.receive_text()  # keep alive
#     except WebSocketDisconnect:
#         manager.disconnect_teacher(websocket)

import os
from typing import List
from fastapi import FastAPI, Depends, Form, Response, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import Base, engine, SessionLocal
from models import User
from schemas import UserCreate
from auth import create_token, get_user_from_cookie
from websocket import student_ws, teacher_ws
from report import router as report_router

# ------------------ Setup ------------------
Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hash_: str) -> bool:
    return pwd_context.verify(password, hash_)

# ------------------ FastAPI app ------------------
app = FastAPI()
app.include_router(report_router)
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ DB Dependency ------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------ Routes ------------------
@app.get("/")
def home():
    return {"msg": "backend running"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.role not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
def login(
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user.id, user.role)
    response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax")
    return {"message": "ok"}

@app.get("/me")
def me(request: Request):
    return get_user_from_cookie(request)

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "logged out"}

# ------------------ WebSockets ------------------
@app.websocket("/ws/student")
async def ws_student(ws: WebSocket):
    await student_ws(ws)

@app.websocket("/ws/teacher")
async def ws_teacher(ws: WebSocket):
    await teacher_ws(ws)
