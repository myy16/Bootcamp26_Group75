import os
import re
import json
import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END
from openai import OpenAI

# Import database functions
from test.database import (
    get_user_profile,
    update_user_profile,
    search_products_by_keyword,
    search_products_by_profile,
    get_market_name,
    get_markets_map,
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY bulunamadı. Proje kökündeki .env dosyasına "
        "GROQ_API_KEY=gsk_... şeklinde ekleyin."
    )

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)
# === Define State Schema ===
class AgentState(BaseModel):
    user_id: str
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    profile_context: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    retrieved_products: List[Dict[str, Any]] = Field(default_factory=list)
    routing_decision: Optional[str] = None
    profile_just_completed: bool = False


# === Helper Functions ===

def parse_json_from_text(text: str) -> dict:
    """Extracts JSON object from text that may contain markdown or extra content."""
    try:
        return json.loads(text.strip())
    except (json.JSONDecodeError, ValueError):
        pass
    # Try extracting from markdown code block
    match = re.search(r'```(?:json)?\s*\n?(.+?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass
    # Try finding a JSON object pattern
    match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass
    return {}


def retry_groq_call(call_func, max_retries=3):
    """Wraps Groq API call with retry logic for rate limit (429) errors."""
    for attempt in range(max_retries):
        try:
            return call_func()
        except Exception as e:
            err_str = str(e).lower()
            if "rate_limit" in err_str or "429" in err_str or "quota" in err_str or "limit" in err_str:
                wait = 5 * (attempt + 1)
                print(f"Groq rate limit hit, waiting {wait}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded for Groq API call")


def get_last_user_message(messages: list) -> str:
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return msg.get("content", "")
    return ""


def extract_profile_info(user_message: str) -> dict:
    """Extracts skin/hair profile from user message using Groq."""
    try:
        prompt = (
            "Aşağıdaki kullanıcı mesajından cilt ve saç profili bilgilerini çıkar.\n"
            "SADECE bir JSON nesnesi döndür, başka hiçbir şey yazma.\n"
            "Örnek çıktı: {\"skin_type\": \"kuru\", \"hair_type\": \"normal\", \"skin_concerns\": []}\n"
            "Kurallar:\n"
            "- skin_type: 'kuru', 'yağlı', 'karma' veya 'normal' (belirtilmemişse null)\n"
            "- hair_type: 'kuru', 'yağlı', 'normal' veya 'karma' (belirtilmemişse null)\n"
            "- skin_concerns: bulunan endişelerin listesi (örn: ['akne', 'leke']) veya boş liste []\n\n"
            f"Kullanıcı mesajı: {user_message}"
        )

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "Sen bir kozmetik profil çıkarıcısısın."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.1,
                response_format={"type": "json_object"}
            )

        response = retry_groq_call(make_call)
        return parse_json_from_text(response.choices[0].message.content)
    except Exception as e:
        print(f"Error extracting profile info: {e}")
        return {}


def determine_intent(user_message: str) -> str:
    """
    Determines whether the user wants a product recommendation
    or general conversation.
    """

    message_lower = user_message.lower()

    recommendation_keywords = [
        "öner",
        "öneri",
        "önerir misin",
        "ürün",
        "fiyat",
        "en ucuz",
        "karşılaştır",
        "nemlendirici",
        "serum",
        "güneş kremi",
        "fondöten",
        "ruj",
        "şampuan",
        "saç kremi",
        "tonik",
        "temizleyici",
        "maske",
        "peeling",
    ]

    if any(keyword in message_lower for keyword in recommendation_keywords):
        return "recommendation"

    try:
        prompt = (
            "Kullanıcının mesajını analiz et. Kozmetik/bakım ürünü önerisi, "
            "fiyat karşılaştırması veya bakım rutini istiyorsa "
            "'recommendation' döndür. Genel sohbet, selamlama veya "
            "ürünle ilgisiz soruysa 'general' döndür.\n"
            "Sadece tek kelime döndür: recommendation veya general\n\n"
            f"Mesaj: {user_message}"
        )

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Sen bir niyet analizi asistanısın. "
                            "Sadece recommendation veya general yaz."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=10,
                temperature=0.0,
            )

        response = retry_groq_call(make_call)
        intent = response.choices[0].message.content.strip().lower()

        return (
            "recommendation"
            if "recommendation" in intent
            else "general"
        )

    except Exception as e:
        print(f"Error determining intent: {e}")
        return "general"


def format_product_context(products: list) -> str:
    """Formats product data into a clean context string for the LLM."""
    if not products:
        return "Veritabanında bu kriterlere uygun ürün bulunamadı."

    lines = []
    for i, p in enumerate(products, 1):
        lines.append(f"{i}. {p.get('universal_name')} (Kategori: {p.get('category_name', 'N/A')})")

        stores = p.get("store_mappings", [])
        if stores:
            for st in stores:
                market_name = st.get("market_name", get_market_name(st.get("m_id", 0)))
                price = st.get("current_price")
                url = st.get("product_url", "#")

                if price and price > 0:
                    lines.append(f"   - {market_name}: {price} TL | Link: {url}")
        else:
            lines.append("   - Fiyat bilgisi bulunamadı")

    return "\n".join(lines)
def build_product_response(products: list) -> str:
    """LLM boş cevap verirse ürünlerden güvenli bir fallback metni oluşturur."""
    if not products:
        return "Bütçenize ve profilinize uygun ürün bulunamadı."

    lines = ["Profilinize ve bütçenize uygun ürünler:"]

    for product in products[:3]:
        product_name = product.get("universal_name", "Ürün")
        stores = product.get("store_mappings", [])

        valid_stores = [
            store
            for store in stores
            if store.get("current_price") is not None
            and float(store.get("current_price", 0)) > 0
        ]

        if valid_stores:
            cheapest_store = min(
                valid_stores,
                key=lambda store: float(store["current_price"]),
            )

            market_name = cheapest_store.get(
                "market_name",
                "Bilinmeyen mağaza",
            )
            price = cheapest_store.get("current_price")
            url = cheapest_store.get("product_url", "#")

            lines.append(
                f"- {product_name}: {market_name} mağazasında "
                f"{price} TL — [Satın Al]({url})"
            )
        else:
            lines.append(
                f"- {product_name}: Güncel fiyat bilgisi bulunamadı."
            )

    return "\n".join(lines)

# === Graph Nodes ===

def fetch_profile_node(state: AgentState):
    """Loads user profile, extracts info from message, saves and checks completeness."""
    user_id = state.user_id
    last_msg = get_last_user_message(state.messages)

    # Track if profile was incomplete before this message
    existing_profile = get_user_profile(user_id) or {}
    was_incomplete = not existing_profile.get("skin_type") or not existing_profile.get("hair_type")

    # Try extracting profile info from user message
    if last_msg:
        extracted = extract_profile_info(last_msg)
        extracted = {k: v for k, v in extracted.items() if v is not None}

        if extracted:
            print(f"Extracted profile info: {extracted}")
            merged = {
                "full_name": existing_profile.get("full_name") or "User",
                "skin_type": extracted.get("skin_type") or existing_profile.get("skin_type"),
                "hair_type": extracted.get("hair_type") or existing_profile.get("hair_type"),
                "skin_concerns": list(
                    set(
                    existing_profile.get("skin_concerns", [])
                    + extracted.get("skin_concerns", [])
                )) if "skin_concerns" in extracted
                else existing_profile.get("skin_concerns", []),

                "min_budget": existing_profile.get("min_budget"),
                "max_budget": existing_profile.get("max_budget"),
            }
            update_user_profile(user_id, merged)

    # Re-fetch profile after potential update
    profile = get_user_profile(user_id) or {}
    required = ["skin_type", "hair_type"]
    missing = [f for f in required if not profile.get(f)]

    # Did this message just complete the profile?
    is_now_complete = len(missing) == 0
    just_completed = was_incomplete and is_now_complete

    return {
        "profile_context": profile,
        "missing_fields": missing,
        "profile_just_completed": just_completed,
    }


def onboarding_fallback_node(state: AgentState):
    """Asks the user to provide missing profile fields. Short and direct."""
    missing = state.missing_fields
    parts = []
    if "skin_type" in missing:
        parts.append("cilt tipiniz (kuru, yağlı, karma, normal)")
    if "hair_type" in missing:
        parts.append("saç tipiniz (kuru, yağlı, karma, normal)")

    bot_message = (
        f"Merhaba! Size uygun ürünleri önerebilmem için "
        f"**{' ve '.join(parts)}** bilgisine ihtiyacım var.\n\n"
        f"Örnek: *\"Cildim kuru, saçım normal\"*"
    )

    new_messages = state.messages.copy()
    new_messages.append({"role": "assistant", "content": bot_message})
    return {"messages": new_messages}


def profile_confirmed_node(state: AgentState):
    """Confirms the profile was saved. Does NOT recommend products."""
    profile = state.profile_context
    skin = profile.get("skin_type", "belirtilmedi")
    hair = profile.get("hair_type", "belirtilmedi")
    concerns = profile.get("skin_concerns", [])

    concern_text = f", Cilt Problemleri: {', '.join(concerns)}" if concerns else ""

    bot_message = (
        f"Profiliniz kaydedildi:\n"
        f"- Cilt tipi: **{skin}**\n"
        f"- Saç tipi: **{hair}**{concern_text}\n\n"
        f"Artık size özel ürün önerileri alabilirsiniz. "
        f"Örneğin *\"Bana nemlendirici öner\"* veya *\"En uygun fondöten hangisi?\"* diye sorabilirsiniz."
    )

    new_messages = state.messages.copy()
    new_messages.append({"role": "assistant", "content": bot_message})
    return {"messages": new_messages}


def general_chat_node(state: AgentState):
    """Handles general conversation. Short and helpful."""
    try:
        system_prompt = (
            "Sen Beautrics kozmetik danışmanısın. Kısa ve öz cevaplar ver.\n"
            "KURALLAR:\n"
            "- Maksimum 3-4 cümle ile cevap ver.\n"
            "- Emoji kullanma.\n"
            "- Ürün önerisi yapma, sadece genel bilgi ver.\n"
            "- Kullanıcıyı ürün araması yapmaya yönlendir.\n"
            "- Türkçe konuş."
        )

        messages_payload = [{"role": "system", "content": system_prompt}]
        for msg in state.messages:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages_payload.append({"role": role, "content": msg.get("content")})

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_payload,
                max_tokens=250,
                temperature=0.7
            )

        response = retry_groq_call(make_call)
        content = response.choices[0].message.content

        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": content})
        return {"messages": new_messages}
    except Exception as e:
        print(f"Error in general_chat_node: {e}")
        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": "Teknik bir sorun oluştu. Lütfen tekrar deneyin."})
        return {"messages": new_messages}


def vector_rag_node(state: AgentState):
    """
    RAG node: searches products, formats context, generates recommendation.
    Uses category-aware keyword search as primary, vector search as secondary.
    """
    profile = state.profile_context
    last_msg = get_last_user_message(state.messages)

    try:
        # 1. Search products (profile-based category search first)
        matched_products = search_products_by_profile(profile, last_msg, match_count=3)

        # 2. If keyword search found nothing, try vector search (vector search)
        if not matched_products:
            try:
                profile_summary = f"Cilt: {profile.get('skin_type')}, Saç: {profile.get('hair_type')}"
                search_query = f"{last_msg}. {profile_summary}"

                def make_emb():
                    return client.embeddings.create(
                        model="text-embedding-3-small",
                        input=search_query
                    )

                emb_res = retry_groq_call(make_emb)
                query_embedding = emb_res.data[0].embedding
                matched_products = match_products(query_embedding, match_count=3)
            except Exception as emb_err:
                print(f"Vector search also failed: {emb_err}")

        # 3. If still nothing, try a broader keyword search
        if not matched_products:
            matched_products = search_products_by_keyword("cilt bakım", match_count=3)

        # 4. Format product context
        product_context = format_product_context(matched_products)

        # 5. Build profile summary
        profile_summary = (
            f"Cilt Tipi: {profile.get('skin_type', 'N/A')}, "
            f"Saç Tipi: {profile.get('hair_type', 'N/A')}, "
            f"Cilt Problemleri: {', '.join(profile.get('skin_concerns', [])) or 'yok'}, "
            f"Minimum Bütçe: {profile.get('min_budget', '-')}, "
            f"Maksimum Bütçe: {profile.get('max_budget', '-')} TL"
        )

        # 6. Generate response with strict prompt
        system_prompt = (
            "Sen Beautrics kozmetik danışmanısın. Kullanıcının profiline uygun ürün önerisi yap.\n\n"
            "KATI KURALLAR:\n"
            "1. SADECE aşağıdaki ürün listesindeki ürünleri öner. Listeye olmayan ürün ekleme.\n"
            "2. Maksimum 3 ürün öner.\n"
            "3. Her ürün için: isim, mağaza adı, fiyat ve satın alma linkini yaz.\n"
            "4. En ucuz seçeneği belirt.\n"
            "5. Fiyatı 0 TL olan ürünler stokta olmayabilir, bunu belirt.\n"
            "6. Emoji kullanma.\n"
            "7. Kısa ve net cevaplar ver (en fazla 200 kelime).\n"
            "8. Ürünler hakkında uydurma bilgi verme, sadece isimleri ve fiyatları kullan.\n"
            "9. Satın alma linklerini [Satın Al](url) formatında ekle.\n\n"
            f"KULLANICI PROFİLİ:\n{profile_summary}\n\n"
            f"ÜRÜN LİSTESİ:\n{product_context}"
        )

        messages_payload = [{"role": "system", "content": system_prompt}]
        for msg in state.messages:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages_payload.append({"role": role, "content": msg.get("content")})

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_payload,
                max_tokens=400,
                temperature=0.7
            )

        chat_response = retry_groq_call(make_call)

        content = chat_response.choices[0].message.content or ""
        content = content.strip()

        if not content:
            print("Groq returned empty content. Using product fallback.")
            content = build_product_response(matched_products)

        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": content})

        return {
            "messages": new_messages,
            "retrieved_products": matched_products,
        }
    except Exception as e:
        print(f"Error in vector_rag_node: {e}")
        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": "Ürün önerisi getirilirken bir sorun oluştu."})
        return {"messages": new_messages}


# === Build LangGraph Workflow ===
workflow = StateGraph(AgentState)

workflow.add_node("fetch_profile", fetch_profile_node)
workflow.add_node("onboarding_fallback", onboarding_fallback_node)
workflow.add_node("profile_confirmed", profile_confirmed_node)
workflow.add_node("vector_rag", vector_rag_node)
workflow.add_node("general_chat", general_chat_node)

workflow.set_entry_point("fetch_profile")


def route_after_profile(state: AgentState):
    """Routes to the correct node based on profile state and user intent."""
    # 1. Profile still incomplete -> ask for missing fields
    if state.missing_fields:
        return "onboarding_fallback"

    # 2. Profile was just completed with this message -> confirm only
    if state.profile_just_completed:
        return "profile_confirmed"

    # 3. Profile is complete, determine intent
    last_msg = get_last_user_message(state.messages)
    intent = determine_intent(last_msg)
    print(f"Intent decision: {intent} | Message: {last_msg}")

    if intent == "recommendation":
        return "vector_rag"
    else:
        return "general_chat"


workflow.add_conditional_edges(
    "fetch_profile",
    route_after_profile,
    {
        "onboarding_fallback": "onboarding_fallback",
        "profile_confirmed": "profile_confirmed",
        "vector_rag": "vector_rag",
        "general_chat": "general_chat",
    }
)

workflow.add_edge("onboarding_fallback", END)
workflow.add_edge("profile_confirmed", END)
workflow.add_edge("vector_rag", END)
workflow.add_edge("general_chat", END)

chatbot_app = workflow.compile()