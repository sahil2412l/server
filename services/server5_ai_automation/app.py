#!/usr/bin/env python3
"""
Server 5: AI Automation & LLM Orchestration Microservice
Consumes asynchronous heavy tasks from Redis message queue.
Orchestrates AI model workflows and updates task state.
Strictly resides in private VPC.
"""

import os
import json
import time
import threading
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
import redis
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

REDIS_HOST = os.environ.get("REDIS_HOST", "redis")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", None)
TASK_QUEUE_NAME = "ai_task_queue"
TASK_RESULTS_PREFIX = "ai_task_result:"

# Connect to Redis
try:
    r_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=True,
        socket_connect_timeout=3
    )
except Exception:
    r_client = None

app = FastAPI(
    title="Server 5 (AI Automation & LLM Orchestrator)",
    version="1.0.0",
    docs_url=None,
    redoc_url=None
)

AI_TASKS_PROCESSED = Counter('server5_ai_tasks_processed_total', 'Total AI Tasks Processed', ['model', 'status'])
TASK_EXEC_TIME = Histogram('server5_ai_task_duration_seconds', 'Task Execution Duration in seconds')
ACTIVE_WORKERS = Gauge('server5_active_workers', 'Number of Active AI Workers')

def background_worker():
    """Background consumer polling Redis for asynchronous AI jobs."""
    ACTIVE_WORKERS.inc()
    print(f"[*] Server 5 AI Background Worker started. Listening on '{TASK_QUEUE_NAME}'...")
    while True:
        try:
            if not r_client:
                time.sleep(2)
                continue
            
            # Blocking pop from Redis queue (timeout 2s)
            item = r_client.blpop(TASK_QUEUE_NAME, timeout=2)
            if not item:
                continue
            
            queue_name, raw_data = item
            task_data = json.loads(raw_data)
            task_id = task_data.get("task_id", "unknown")
            model = task_data.get("model", "gemini-2.5-flash")
            payload = task_data.get("payload", {})

            print(f"[+] Processing task {task_id} with model {model}")
            start_time = time.time()

            # Simulated heavy AI execution / LLM orchestration
            time.sleep(0.5)
            duration = time.time() - start_time
            TASK_EXEC_TIME.observe(duration)

            result = {
                "task_id": task_id,
                "status": "COMPLETED",
                "orchestrated_by": "Server 5 AI Worker",
                "model_used": model,
                "output": f"AI Automation executed successfully for query: {payload.get('query', 'N/A')}",
                "execution_seconds": round(duration, 3),
                "completed_at": time.time()
            }

            # Save result in Redis with 1 hour expiration
            r_client.setex(f"{TASK_RESULTS_PREFIX}{task_id}", 3600, json.dumps(result))
            AI_TASKS_PROCESSED.labels(model=model, status="success").inc()

        except Exception as e:
            print(f"[-] Worker error: {e}")
            time.sleep(1)

# Start background worker daemon thread
worker_thread = threading.Thread(target=background_worker, daemon=True)
worker_thread.start()

@app.get("/health")
def health():
    redis_ok = False
    try:
        if r_client and r_client.ping():
            redis_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if redis_ok else "degraded",
        "service": "server5_ai_automation",
        "redis_connected": redis_ok,
        "worker_running": worker_thread.is_alive(),
        "network": "private_vpc_only"
    }

@app.get("/tasks/{task_id}")
def get_task_status(task_id: str):
    if not r_client:
        raise HTTPException(status_code=503, detail="Redis queue unavailable")
    
    val = r_client.get(f"{TASK_RESULTS_PREFIX}{task_id}")
    if not val:
        return {"task_id": task_id, "status": "PENDING_OR_NOT_FOUND"}
    return json.loads(val)

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
