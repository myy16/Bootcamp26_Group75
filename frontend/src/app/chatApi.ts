const API_BASE = "http://localhost:8000";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  user_id: string;
  session_id: string;
  response: string;
  profile: {
    user_id?: string;
    full_name?: string;
    skin_type?: string | null;
    hair_type?: string | null;
    skin_concerns?: string[];
  };
  missing_fields: string[];
  history: ChatMessage[];
  retrieved_products: any[];
}

export async function sendChatMessage(
  userId: string,
  message: string,
  sessionId: string = "default_session"
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      message,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserProfile(userId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/profile/${userId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Profile API error: ${response.statusText}`);
  }
  return response.json();
}

export async function clearSession(userId: string, sessionId: string = "default_session"): Promise<any> {
  const response = await fetch(`${API_BASE}/session/clear?user_id=${userId}&session_id=${sessionId}`, {
    method: "POST"
  });
  return response.json();
}
