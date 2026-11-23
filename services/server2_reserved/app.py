#!/usr/bin/env python3
"""
Server 2: Reserved Service
Pre-provisioned isolated microservice for future scalability (Auth / Notification Service).
"""

from fastapi import FastAPI

app = FastAPI(title="Server 2: Reserved Service", version="1.0.0")

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "server2_reserved",
        "allocation": "reserved_for_auth_notification",
        "state": "standby"
    }

@app.get("/")
def index():
    return {
        "message": "Server 2 (Reserved) is online and ready for deployment",
        "allocated_purpose": "Auth / Notification Service"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
