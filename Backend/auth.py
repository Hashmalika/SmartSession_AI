# import jwt
# from fastapi import HTTPException, Request

# SECRET = "supersecret"
# ALGO = "HS256"

# def verify_token_from_cookie(request: Request):
#     token = request.cookies.get("access_token")
#     if not token:
#         raise HTTPException(401, "Not Authenticated")

#     try:
#         return jwt.decode(token, SECRET, algorithms=[ALGO])
#     except:
#         raise HTTPException(401, "Invalid token")

import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Request

SECRET = "supersecret"
ALGO = "HS256"

def create_token(user_id: int, role: str):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)


def get_user_from_cookie(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGO])
    except:
        raise HTTPException(401, "Invalid token")
