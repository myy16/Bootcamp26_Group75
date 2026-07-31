import { supabase } from "./supabase";

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
  try {
    const response = await fetch(`${API_BASE}/profile/${userId}`);
    if (response.ok) {
      const data = await response.json();
      if (data && (data.skin_type || data.hair_type || data.onboarding_completed)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Could not fetch user profile from FastAPI API, checking Supabase fallback:", e);
  }

  // Supabase Direct Fallback Check
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("skin_type_id, hair_type_id, onboarding_completed, skin_types!skin_type_id(name), hair_types!hair_type_id(name)")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const skinTypeName = (data as any)?.skin_types?.name || null;
      const hairTypeName = (data as any)?.hair_types?.name || null;
      const isDone = Boolean(data.onboarding_completed || skinTypeName || hairTypeName);
      return {
        user_id: userId,
        skin_type: skinTypeName,
        hair_type: hairTypeName,
        onboarding_completed: isDone
      };
    }
  } catch (supabaseErr) {
    console.warn("Supabase direct profile check error:", supabaseErr);
  }

  return { user_id: userId, skin_type: null, hair_type: null, onboarding_completed: false };
}

export async function clearSession(userId: string, sessionId: string = "default_session"): Promise<any> {
  const response = await fetch(`${API_BASE}/session/clear?user_id=${userId}&session_id=${sessionId}`, {
    method: "POST"
  });
  return response.json();
}
