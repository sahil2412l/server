#!/usr/bin/env python3
"""
Server 1: Core Application Service
Handles business logic, user management, content, and asynchronous queue dispatch.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
import redis
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("server1_core")

app = FastAPI(title="Server 1: Core Application Service", version="1.0.0")

# Environment & Config
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
CORE_DB_HOST = os.getenv("CORE_DB_HOST", "core_db")

# Redis connection for asynchronous tasks
redis_client = None
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
    logger.info(f"Connected to Redis message queue at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis connection warning: {e}")

# Metrics
REQUEST_COUNT = Counter("server1_requests_total", "Total requests to Server 1", ["endpoint", "status"])
TASK_DISPATCH_COUNT = Counter("server1_tasks_dispatched_total", "Total heavy tasks dispatched to queue")

# Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class AsyncTaskRequest(BaseModel):
    task_type: str = Field(..., example="ai_workflow_trigger")
    payload: Dict[str, Any]
    priority: str = Field(default="normal", regex="^(low|normal|high)$")

@app.get("/health")
def health_check():
    """Heartbeat check consumed by Gateway and Prometheus."""
    redis_status = "connected"
    if redis_client:
        try:
            redis_client.ping()
        except Exception:
            redis_status = "degraded"
    else:
        redis_status = "offline"

    return {
        "status": "healthy",
        "service": "server1_core",
        "database": "core_db_ready",
        "message_queue": redis_status
    }

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/")
def read_root():
    REQUEST_COUNT.labels(endpoint="/", status="200").inc()
    return {
        "message": "Server 1 (Core Application) active",
        "endpoints": ["/users", "/dispatch-task", "/health", "/metrics"]
    }

@app.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    REQUEST_COUNT.labels(endpoint="/users", status="201").inc()
    logger.info(f"Created core user: {user.username} ({user.email})")
    return {
        "user_id": f"usr_{os.urandom(4).hex()}",
        "username": user.username,
        "email": user.email,
        "status": "active"
    }

@app.post("/dispatch-task", status_code=status.HTTP_202_ACCEPTED)
def dispatch_heavy_task(task: AsyncTaskRequest):
    """Dispatches heavy tasks asynchronously via Redis message queue to Server 5 (AI Automation)."""
    if not redis_client:
        raise HTTPException(status_code=503, detail="Message Queue unavailable")

    job_id = f"job_{os.urandom(6).hex()}"
    queue_message = {
        "job_id": job_id,
        "task_type": task.task_type,
        "priority": task.priority,
        "payload": task.payload
    }

    # Push to Redis queue for Server 5 to process
    redis_client.rpush("ai_task_queue", json.dumps(queue_message))
    TASK_DISPATCH_COUNT.inc()
    REQUEST_COUNT.labels(endpoint="/dispatch-task", status="202").inc()
    logger.info(f"Dispatched asynchronous job {job_id} to queue 'ai_task_queue'")

    return {
        "message": "Task accepted for asynchronous processing",
        "job_id": job_id,
        "status": "queued",
        "queue": "ai_task_queue"
    }
