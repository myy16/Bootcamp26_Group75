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
    match_products,
    get_product_by_id,
    get_product_by_name,
    get_product_alternatives,
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
    # Sohbet bağlamı: en son önerilen ürünler (muadil aramada referans olarak kullanılır)
    last_recommended_products: List[Dict[str, Any]] = Field(default_factory=list)
    # Sohbette belirtilen bütçe (profil bütçesinin üstüne geçer)
    chat_budget_override: Optional[Dict[str, Any]] = None


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


def extract_budget_from_message(user_message: str) -> Optional[Dict[str, float]]:
    """Extracts budget information from user message using Turkish price patterns."""
    msg = user_message.lower().replace("lira", "tl")

    # Pattern: "50-150 TL arası" or "50 ile 150 TL"
    range_match = re.search(r'(\d+)\s*[-–]\s*(\d+)\s*(?:tl|₺)', msg)
    if not range_match:
        range_match = re.search(r'(\d+)\s*(?:tl|₺)?\s*(?:ile|ila|-)\s*(\d+)\s*(?:tl|₺)', msg)
    if range_match:
        return {"min_budget": float(range_match.group(1)), "max_budget": float(range_match.group(2))}

    # Pattern: "100 TL altı" / "en fazla 200" / "maksimum 300"
    max_match = re.search(r'(?:en fazla|en çok|maksimum|max|altında|altı)\s*(\d+)', msg)
    if not max_match:
        max_match = re.search(r'(\d+)\s*(?:tl|₺)?\s*(?:altı|altında|a kadar|ya kadar|den az|dan az)', msg)
    if max_match:
        return {"max_budget": float(max_match.group(1))}

    # Pattern: "bütçem 200 TL" / "200 TL bütçe"
    budget_match = re.search(r'(?:bütçe[ms]?i?|bütçe)\s*(\d+)', msg)
    if not budget_match:
        budget_match = re.search(r'(\d+)\s*(?:tl|₺)\s*bütçe', msg)
    if budget_match:
        return {"max_budget": float(budget_match.group(1))}

    # Pattern: "en az 50 TL"
    min_match = re.search(r'(?:en az|minimum|min)\s*(\d+)', msg)
    if min_match:
        return {"min_budget": float(min_match.group(1))}

    return None


def get_effective_budget(profile: dict, chat_override: Optional[dict]) -> dict:
    """Profil bütçesi ile sohbet bütçesini birleştirip etkin bütçeyi döndürür.
    Sohbette bütçe belirtilmişse profil bütçesinin üstüne geçer."""
    if chat_override:
        return {
            "min_budget": chat_override.get("min_budget", profile.get("min_budget")),
            "max_budget": chat_override.get("max_budget", profile.get("max_budget")),
        }
    return {
        "min_budget": profile.get("min_budget"),
        "max_budget": profile.get("max_budget"),
    }


def detect_store_name(user_message: str) -> Optional[str]:
    """Detects if user mentions a specific store name in their message."""
    store_keywords = {
        "gratis": "Gratis",
        "watsons": "Watsons",
        "rossmann": "Rossmann",
        "mion": "Mion",
    }
    msg_lower = user_message.lower()
    for keyword, store_name in store_keywords.items():
        if keyword in msg_lower:
            return store_name
    return None


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
    Determines whether the user wants:
    - 'recommendation': new product search
    - 'alternative': find dupe/cheaper/store-specific version of a previously recommended product
    - 'store_compare': find product in a specific store
    - 'general': general conversation
    """

    message_lower = user_message.lower()

    # 1. Check for alternative/dupe keywords first (more specific)
    alternative_keywords = [
        "muadil", "alternatif", "benzer", "yerine", "daha ucuz",
        "uygun fiyatlı", "ucuz alternatif", "benzeri", "bunun yerine",
        "daha uygun", "ucuzu", "ucuzunu", "başka seçenek",
    ]
    if any(keyword in message_lower for keyword in alternative_keywords):
        return "alternative"

    # 2. Check for store-specific comparison
    store_compare_keywords = [
        "gratis'te", "gratis'de", "gratis'da", "gratiste",
        "watsons'ta", "watsons'da", "watsonsta",
        "rossmann'da", "rossmann'de", "rossmannda",
        "mion'da", "mion'de", "mionda",
        "başka mağaza", "farklı mağaza", "hangi mağaza",
    ]
    if any(keyword in message_lower for keyword in store_compare_keywords):
        return "store_compare"

    # 3. Check for standard recommendation keywords
    recommendation_keywords = [
        "öner", "öneri", "önerir misin", "ürün", "fiyat",
        "en ucuz", "karşılaştır", "nemlendirici", "serum",
        "güneş kremi", "fondöten", "ruj", "şampuan", "saç kremi",
        "tonik", "temizleyici", "maske", "peeling",
    ]
    if any(keyword in message_lower for keyword in recommendation_keywords):
        return "recommendation"

    # 4. Fallback to LLM intent classification
    try:
        prompt = (
            "Kullanıcının mesajını analiz et ve aşağıdaki kategorilerden BİRİNİ döndür:\n"
            "- 'recommendation': Yeni kozmetik/bakım ürünü önerisi, fiyat karşılaştırması veya bakım rutini istiyorsa\n"
            "- 'alternative': Daha önce önerilen bir ürünün muadili, daha ucuzu, benzeri veya başka mağazadaki versiyonunu istiyorsa\n"
            "- 'general': Genel sohbet, selamlama veya ürünle ilgisiz soruysa\n"
            "Sadece tek kelime döndür: recommendation, alternative veya general\n\n"
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
                            "Sadece recommendation, alternative veya general yaz."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=10,
                temperature=0.0,
            )

        response = retry_groq_call(make_call)
        intent = response.choices[0].message.content.strip().lower()

        if "alternative" in intent:
            return "alternative"
        elif "recommendation" in intent:
            return "recommendation"
        else:
            return "general"

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
    """Loads user profile, extracts info from message, saves and checks completeness.
    Also extracts budget override from chat message."""
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

    # Extract budget override from chat message
    budget_override = None
    if last_msg:
        budget_override = extract_budget_from_message(last_msg)
        if budget_override:
            print(f"Chat budget override detected: {budget_override}")

    return {
        "profile_context": profile,
        "missing_fields": missing,
        "profile_just_completed": just_completed,
        # Keep previous override if no new one found in this message
        "chat_budget_override": budget_override if budget_override else state.chat_budget_override,
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
    RAG node:
    - Etkin bütçeyi (profil veya sohbet override) hesaplar.
    - Önce kullanıcı profiline ve mesajına göre ürün arar.
    - Sonuç yoksa mesaj anahtar kelimeleriyle arama yapar.
    - Bulunan ürünleri last_recommended_products'a kaydeder.
    - Groq ile kısa ve güvenli bir öneri metnine dönüştürür.
    """
    profile = state.profile_context
    last_msg = get_last_user_message(state.messages)

    # Etkin bütçeyi hesapla
    effective_budget = get_effective_budget(profile, state.chat_budget_override)

    try:
        matched_products = []

        # 1. Try vector similarity search (OpenAI Embeddings) first
        try:
            profile_summary = f"Cilt Tipi: {profile.get('skin_type', 'normal')}, Saç Tipi: {profile.get('hair_type', 'normal')}"
            search_query = f"{last_msg}. {profile_summary}"

            emb_res = client.embeddings.create(
                model="text-embedding-3-small",
                input=search_query
            )
            query_embedding = emb_res.data[0].embedding
            matched_products = match_products(query_embedding, match_count=3)
        except Exception as emb_err:
            print(f"Vector search failed or not configured: {emb_err}")

        # 2. Fallback to profile-based category search
        if not matched_products:
            matched_products = search_products_by_profile(
                profile, last_msg, match_count=3,
            )

        # 3. Fallback to keyword search
        if not matched_products:
            matched_products = search_products_by_keyword(
                last_msg, match_count=3,
            )

        # 4. Fallback to general skincare products
        if not matched_products:
            matched_products = search_products_by_keyword(
                "cilt bakım", match_count=3,
            )

        # 5. Bütçe filtresi uygula
        if effective_budget.get("max_budget"):
            max_b = float(effective_budget["max_budget"])
            filtered = []
            for p in matched_products:
                stores = p.get("store_mappings", [])
                valid_prices = [float(s["current_price"]) for s in stores if s.get("current_price") and float(s["current_price"]) > 0]
                if valid_prices and min(valid_prices) <= max_b:
                    filtered.append(p)
            if filtered:
                matched_products = filtered

        # 6. Ürünleri model için bağlam metnine dönüştür
        product_context = format_product_context(matched_products)

        # 7. Kullanıcı profilini özetle (etkin bütçe ile)
        profile_summary = (
            f"Cilt Tipi: {profile.get('skin_type', 'N/A')}, "
            f"Saç Tipi: {profile.get('hair_type', 'N/A')}, "
            f"Cilt Problemleri: "
            f"{', '.join(profile.get('skin_concerns', [])) or 'yok'}, "
            f"Minimum Bütçe: {effective_budget.get('min_budget', '-')}, "
            f"Maksimum Bütçe: {effective_budget.get('max_budget', '-')} TL"
        )

        # 8. Groq için güvenli ve sınırlı sistem talimatı
        system_prompt = (
            "Sen Beautrics kozmetik danışmanısın. "
            "Kullanıcının profiline uygun ürün önerisi yap.\n\n"
            "KATI KURALLAR:\n"
            "1. SADECE aşağıdaki ürün listesindeki ürünleri öner. "
            "Listede olmayan ürün ekleme.\n"
            "2. Maksimum 3 ürün öner.\n"
            "3. Her ürün için isim, mağaza, fiyat ve satın alma linkini yaz.\n"
            "4. En ucuz seçeneği belirt.\n"
            "5. Fiyatı 0 TL olan ürünler stokta olmayabilir; bunu belirt.\n"
            "6. Emoji kullanma.\n"
            "7. Kısa ve net cevap ver; en fazla 200 kelime kullan.\n"
            "8. Ürünler hakkında uydurma bilgi verme.\n"
            "9. Satın alma linklerini [Satın Al](url) formatında ekle.\n\n"
            f"KULLANICI PROFİLİ:\n{profile_summary}\n\n"
            f"ÜRÜN LİSTESİ:\n{product_context}"
        )

        # Sohbet geçmişini son 10 mesajla sınırla (token tasarrufu)
        recent_messages = state.messages[-10:] if len(state.messages) > 10 else state.messages
        messages_payload = [{"role": "system", "content": system_prompt}]
        for msg in recent_messages:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages_payload.append({"role": role, "content": msg.get("content", "")})

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_payload,
                max_tokens=400,
                temperature=0.7,
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
            "last_recommended_products": matched_products,
        }

    except Exception as e:
        print(f"Error in vector_rag_node: {e}")
        fallback_content = build_product_response([])
        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": fallback_content})
        return {
            "messages": new_messages,
            "retrieved_products": [],
        }


def alternative_rag_node(state: AgentState):
    """
    Muadil/Alternatif ürün arama düğümü.
    - Son önerilen ürünü referans alır.
    - Aynı kategorideki benzer ürünleri vector similarity ile bulur.
    - Mağaza ve fiyat filtrelerini uygular.
    - Profil eşleşmesine göre sıralar.
    """
    profile = state.profile_context
    last_msg = get_last_user_message(state.messages)
    effective_budget = get_effective_budget(profile, state.chat_budget_override)

    try:
        # 1. Referans ürünü belirle: son önerilen ürünlerin ilki
        ref_product = None
        if state.last_recommended_products:
            ref_product = state.last_recommended_products[0]
        
        # Eğer son önerilen ürün yoksa mesajdan ürün adı çıkarmayı dene
        if not ref_product:
            try:
                prompt = (
                    "Aşağıdaki mesajdan kullanıcının bahsettiği ürünün adını çıkar.\n"
                    "SADECE ürün adını yaz, başka hiçbir şey yazma.\n"
                    "Ürün adı bulamazsan sadece 'YOK' yaz.\n\n"
                    f"Mesaj: {last_msg}"
                )
                def make_call():
                    return client.chat.completions.create(
                        model=GROQ_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=50,
                        temperature=0.0,
                    )
                response = retry_groq_call(make_call)
                product_name = response.choices[0].message.content.strip()
                if product_name and product_name.upper() != "YOK":
                    ref_product = get_product_by_name(product_name)
            except Exception as e:
                print(f"Error extracting product name from message: {e}")

        # Referans ürün hâlâ bulunamadıysa kullanıcıya sor
        if not ref_product:
            new_messages = state.messages.copy()
            new_messages.append({
                "role": "assistant",
                "content": "Hangi ürünün muadilini veya alternatifini arıyorsunuz? "
                           "Lütfen ürün adını belirtin veya önce bir ürün önerisi isteyin."
            })
            return {"messages": new_messages}

        ref_product_id = ref_product.get("id")
        ref_product_name = ref_product.get("universal_name", "Ürün")
        print(f"Alternative search reference product: {ref_product_name} (ID: {ref_product_id})")

        # 2. Mağaza filtresi
        target_store = detect_store_name(last_msg)

        # 3. Daha ucuz mu isteniyor?
        cheaper_than = None
        cheaper_keywords = ["daha ucuz", "ucuzu", "ucuzunu", "uygun fiyat", "daha uygun"]
        if any(kw in last_msg.lower() for kw in cheaper_keywords):
            # Referans ürünün en düşük fiyatını bul
            ref_stores = ref_product.get("store_mappings", [])
            ref_prices = [float(s["current_price"]) for s in ref_stores if s.get("current_price") and float(s["current_price"]) > 0]
            if ref_prices:
                cheaper_than = min(ref_prices)

        # 4. Bütçe filtresi
        max_price = effective_budget.get("max_budget")
        if cheaper_than and max_price:
            max_price = min(float(cheaper_than), float(max_price))
        elif cheaper_than:
            max_price = cheaper_than

        # 5. Alternatifleri getir
        alternatives = get_product_alternatives(
            product_id=ref_product_id,
            profile=profile,
            store_name=target_store,
            cheaper_than=max_price,
            match_count=3,
        )

        if not alternatives:
            new_messages = state.messages.copy()
            store_info = f" {target_store} mağazasında" if target_store else ""
            price_info = f" {max_price:.0f} TL altında" if max_price else ""
            new_messages.append({
                "role": "assistant",
                "content": f"{ref_product_name} ürününe{store_info}{price_info} uygun bir alternatif bulunamadı. "
                           f"Farklı bir kategori veya fiyat aralığı ile tekrar deneyebilirsiniz."
            })
            return {"messages": new_messages, "retrieved_products": []}

        # 6. Alternatifleri LLM'e gönder
        product_context = format_product_context(alternatives)
        profile_summary = (
            f"Cilt Tipi: {profile.get('skin_type', 'N/A')}, "
            f"Saç Tipi: {profile.get('hair_type', 'N/A')}, "
            f"Cilt Problemleri: {', '.join(profile.get('skin_concerns', [])) or 'yok'}"
        )

        store_context = f" Kullanıcı özellikle {target_store} mağazasındaki alternatifleri soruyor." if target_store else ""
        price_context = f" Kullanıcı {ref_product_name} ürününden daha ucuz alternatifler istiyor." if cheaper_than else ""

        system_prompt = (
            f"Sen Beautrics kozmetik danışmanısın. Kullanıcı '{ref_product_name}' ürününe alternatif arıyor."
            f"{store_context}{price_context}\n\n"
            "KATI KURALLAR:\n"
            "1. SADECE aşağıdaki alternatif ürün listesindeki ürünleri öner.\n"
            "2. Her ürün için isim, mağaza, fiyat ve satın alma linkini yaz.\n"
            "3. Referans ürünle karşılaştırma yap (fiyat farkı, mağaza).\n"
            "4. Emoji kullanma.\n"
            "5. Kısa ve net cevap ver; en fazla 200 kelime kullan.\n"
            "6. Ürünler hakkında uydurma bilgi verme.\n\n"
            f"KULLANICI PROFİLİ:\n{profile_summary}\n\n"
            f"REFERANS ÜRÜN: {ref_product_name}\n\n"
            f"ALTERNATİF ÜRÜN LİSTESİ:\n{product_context}"
        )

        recent_messages = state.messages[-10:] if len(state.messages) > 10 else state.messages
        messages_payload = [{"role": "system", "content": system_prompt}]
        for msg in recent_messages:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages_payload.append({"role": role, "content": msg.get("content", "")})

        def make_call():
            return client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages_payload,
                max_tokens=400,
                temperature=0.7,
            )

        chat_response = retry_groq_call(make_call)
        content = chat_response.choices[0].message.content or ""
        content = content.strip()

        if not content:
            content = build_product_response(alternatives)

        new_messages = state.messages.copy()
        new_messages.append({"role": "assistant", "content": content})

        return {
            "messages": new_messages,
            "retrieved_products": alternatives,
            "last_recommended_products": alternatives,
        }

    except Exception as e:
        print(f"Error in alternative_rag_node: {e}")
        new_messages = state.messages.copy()
        new_messages.append({
            "role": "assistant",
            "content": "Alternatif ürün aranırken bir hata oluştu. Lütfen tekrar deneyin."
        })
        return {"messages": new_messages, "retrieved_products": []}


# === Build LangGraph Workflow ===
workflow = StateGraph(AgentState)

workflow.add_node("fetch_profile", fetch_profile_node)
workflow.add_node("onboarding_fallback", onboarding_fallback_node)
workflow.add_node("profile_confirmed", profile_confirmed_node)
workflow.add_node("vector_rag", vector_rag_node)
workflow.add_node("alternative_rag", alternative_rag_node)
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

    if intent in ("alternative", "store_compare"):
        return "alternative_rag"
    elif intent == "recommendation":
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
        "alternative_rag": "alternative_rag",
        "general_chat": "general_chat",
    }
)

workflow.add_edge("onboarding_fallback", END)
workflow.add_edge("profile_confirmed", END)
workflow.add_edge("vector_rag", END)
workflow.add_edge("alternative_rag", END)
workflow.add_edge("general_chat", END)

chatbot_app = workflow.compile()