from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis
import json
import os
from rq import Queue
from rq.job import Job
import time
from typing import Optional

app = FastAPI(title="FastContext Queue Server")

# Redis connection
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
queue = Queue("fastcontext", connection=redis_client)

# HF Endpoint
HF_ENDPOINT_URL = os.getenv("HF_ENDPOINT_URL", "https://your-endpoint.hf.space")

class QueryRequest(BaseModel):
    query: str
    codebase_path: str

class QueryResponse(BaseModel):
    result: str
    queue_position: Optional[int] = None
    wait_time: Optional[int] = None

@app.get("/health")
def health():
    return {"status": "healthy", "queue_length": len(queue)}

@app.get("/queue/status")
def queue_status():
    """Get current queue status"""
    return {
        "position": len(queue),
        "estimated_wait_seconds": len(queue) * 30,  # ~30s per query
        "processing": queue.count
    }

@app.post("/query", response_model=QueryResponse)
async def query_fastcontext(request: QueryRequest):
    """Submit a query to FastContext (queued if busy)"""
    
    # Check queue length
    queue_length = len(queue)
    
    if queue_length > 5:
        # Queue is long, return queue position
        return QueryResponse(
            result="Query queued",
            queue_position=queue_length,
            wait_time=queue_length * 30
        )
    
    # Process immediately
    try:
        result = await call_hf_endpoint(request.query, request.codebase_path)
        return QueryResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def call_hf_endpoint(query: str, codebase_path: str) -> str:
    """Call the Hugging Face Inference Endpoint"""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{HF_ENDPOINT_URL}/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('HF_TOKEN', '')}"
            },
            json={
                "model": "microsoft/FastContext-1.0-4B-SFT",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Find relevant code for: {query}\n\nCodebase: {codebase_path}"
                    }
                ],
                "max_tokens": 1000,
            }
        ) as response:
            if response.status != 200:
                raise HTTPException(status_code=500, detail=f"HF API error: {response.status}")
            
            data = await response.json()
            return data["choices"][0]["message"]["content"]

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    """Get status of a queued job"""
    job = Job.fetch(job_id, connection=redis_client)
    return {
        "status": job.status,
        "result": job.result if job.is_finished else None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)