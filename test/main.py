import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Import chatbot and database modules
from test.chatbot import chatbot_app
from test.database import get_user_profile, update_user_profile

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Beautrics Chatbot & RAG API",
    description="FastAPI backend for testing Beautrics LangGraph Chatbot and Supabase RAG system.",
    version="1.0.0"
)

# In-memory session store for chat history (for easy testing in Swagger UI)
SESSIONS: Dict[str, List[Dict[str, Any]]] = {}

# Pydantic models
class ChatRequest(BaseModel):
    user_id: str = Field(..., description="Unique ID of the user (UUID format recommended)")
    message: str = Field(..., description="User message to send to the chatbot")
    session_id: str = Field("default_session", description="Session ID to maintain chat history in-memory")
    history_override: Optional[List[Dict[str, Any]]] = Field(
        None, 
        description="Optional list of previous messages to override session history. Format: [{'role': 'user', 'content': '...'}]"
    )

class ChatResponse(BaseModel):
    user_id: str
    session_id: str
    response: str
    profile: Dict[str, Any]
    missing_fields: List[str]
    history: List[Dict[str, Any]]
    retrieved_products: List[Dict[str, Any]]

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = "User"
    skin_type: Optional[str] = Field(None, description="kuru, yağlı, karma, normal")
    hair_type: Optional[str] = Field(None, description="kuru, yağlı, karma, normal")
    skin_concerns: Optional[List[str]] = Field(default_factory=list, description="e.g. ['akne', 'leke']")
    min_budget: Optional[float] = Field(None, ge=0)
    max_budget: Optional[float] = Field(None, ge=0)
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Beautrics Chatbot & RAG API is running. Go to /docs for Swagger UI."
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    """
    Stateful chatbot endpoint. 
    Maintains message history by `session_id` in-memory.
    If the user's profile is incomplete, the chatbot prompts the user for missing fields.
    If complete, it uses RAG to fetch skin/hair recommendations.
    """
    user_id = request.user_id
    session_key = f"{user_id}:{request.session_id}"
    
    # 1. Resolve history
    if request.history_override is not None:
        history = request.history_override
    else:
        if session_key not in SESSIONS:
            SESSIONS[session_key] = []
        history = SESSIONS[session_key]
        
    # Append the new user message
    history.append({"role": "user", "content": request.message})
    
    # 2. Run LangGraph chatbot workflow
    try:
        initial_state = {
            "user_id": user_id,
            "messages": history,
            "profile_context": {},
            "missing_fields": [],
            "retrieved_products": [],
            "routing_decision": None
        }
        
        result = chatbot_app.invoke(initial_state)
        
        # Update session history in memory
        updated_history = result.get("messages", [])
        if request.history_override is None:
            SESSIONS[session_key] = updated_history
            
        # Get last message as response
        assistant_response = "Üzgünüm, yanıt oluşturulamadı."
        if updated_history:
            last_msg = updated_history[-1]
            if last_msg.get("role") == "assistant":
                assistant_response = last_msg.get("content", "")
                
        return ChatResponse(
            user_id=user_id,
            session_id=request.session_id,
            response=assistant_response,
            profile=result.get("profile_context", {}),
            missing_fields=result.get("missing_fields", []),
            history=updated_history,
            retrieved_products=result.get("retrieved_products", [])
        )
    except Exception as e:
        # Revert last message from history on error
        if request.history_override is None and session_key in SESSIONS:
            SESSIONS[session_key].pop()
        raise HTTPException(status_code=500, detail=f"Chatbot execution error: {str(e)}")

@app.post("/profile/{user_id}")
def update_profile(user_id: str, profile: ProfileUpdateRequest):
    """
    Manually creates or updates a user profile in the database.
    """
    profile_data = {
        "full_name": profile.full_name,
        "skin_type": profile.skin_type,
        "hair_type": profile.hair_type,
        "skin_concerns": profile.skin_concerns,
        "min_budget": profile.min_budget,
        "max_budget": profile.max_budget,
    }
    result = update_user_profile(user_id, profile_data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to update user profile in Supabase.")
    return {
        "status": "success",
        "profile": result
    }

@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    """
    Retrieves user profile from database.
    """
    profile = get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return profile

@app.post("/session/clear")
def clear_session(user_id: str, session_id: str = "default_session"):
    """
    Clears the in-memory chat history for a session.
    """
    session_key = f"{user_id}:{session_id}"
    if session_key in SESSIONS:
        del SESSIONS[session_key]
        return {"status": "success", "message": f"Session {session_id} for user {user_id} cleared."}
    return {"status": "not_found", "message": "Session not found."}
