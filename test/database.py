import os
import json
import math
import uuid
from typing import Optional, Dict
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

supabase_client: Client = None

# Cached markets map {m_id: market_name}
MARKETS_MAP = {}

# Cached categories map {id: name}
CATEGORIES_MAP = {}

# Keyword to category_id mapping for smart search
KEYWORD_CATEGORY_MAP = {}

# Onboarding lookups cached from DB or fallbacks
SKIN_TYPES_LOOKUP = {}  # {name_lower: id}
HAIR_TYPES_LOOKUP = {}  # {name_lower: id}
SKIN_CONCERNS_LOOKUP = {}  # {name_lower: id}

supabase_key = SUPABASE_SECRET_KEY or SUPABASE_ANON_KEY

if SUPABASE_URL and supabase_key:
    try:
        supabase_client = create_client(
            SUPABASE_URL,
            supabase_key
        )
        print("Supabase backend client successfully initialized.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
else:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found.")


def is_valid_uuid(val: str) -> bool:
    """Helper to check if a string is a valid UUID."""
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


def get_markets_map() -> dict:
    """
    Fetches market names from the 'markets' table and caches them.
    Returns dict like {1: 'Watsons', 2: 'Gratis', 3: 'Mion', 4: 'Rossmann'}
    """
    global MARKETS_MAP
    if MARKETS_MAP:
        return MARKETS_MAP

    if not supabase_client:
        MARKETS_MAP = {1: "Watsons", 2: "Gratis", 3: "Mion", 4: "Rossmann"}
        return MARKETS_MAP

    try:
        response = supabase_client.table("markets").select("*").execute()
        if response.data:
            for row in response.data:
                MARKETS_MAP[row["id"]] = row["name"].title()
        else:
            MARKETS_MAP = {1: "Watsons", 2: "Gratis", 3: "Mion", 4: "Rossmann"}
    except Exception as e:
        print(f"Error loading markets map: {e}")
        MARKETS_MAP = {1: "Watsons", 2: "Gratis", 3: "Mion", 4: "Rossmann"}

    return MARKETS_MAP


def get_categories_map() -> dict:
    """
    Fetches category names from the 'categories' table and caches them.
    Also builds a keyword->category_id lookup for smart search.
    """
    global CATEGORIES_MAP, KEYWORD_CATEGORY_MAP
    if CATEGORIES_MAP:
        return CATEGORIES_MAP

    if not supabase_client:
        return {}

    try:
        response = supabase_client.table("categories").select("*").execute()
        if response.data:
            for row in response.data:
                cat_id = row["id"]
                cat_name = row["name"]
                CATEGORIES_MAP[cat_id] = cat_name

                # Build keyword mapping
                words = cat_name.lower().replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ç", "c").replace("ğ", "g")
                KEYWORD_CATEGORY_MAP[cat_name.lower()] = cat_id

        # Common user-facing Turkish synonyms -> category_id
        synonym_map = {
            "nemlendirici": 27, "moisturizer": 27, "yüz kremi": 27, "yüz nemlendiricisi": 27,
            "serum": 30, "yüz serumu": 30,
            "güneş kremi": 25, "spf": 25, "güneş koruyucu": 25, "güneş losyonu": 25,
            "fondöten": 8, "foundation": 8,
            "ruj": 20, "lipstick": 20,
            "likit ruj": 21,
            "maskara": 16,
            "eyeliner": 17,
            "göz kalemi": 18,
            "far": 19, "göz farı": 19,
            "allık": 10, "blush": 10,
            "pudra": 14,
            "kapatıcı": 9, "concealer": 9,
            "tonik": 24, "toner": 24, "temizleyici": 24, "temizleme": 24, "yüz temizleme": 24,
            "maske": 29, "yüz maskesi": 29,
            "peeling": 31,
            "dudak": [32, 23, 7, 20], "dudak bakım": [32, 23, 7], "dudak kremi": [32, 23], "dudak nemlendiricisi": [32, 23], "dudak nemlendirici": [32, 23], "dudak balamı": [32, 23], "balm": [32, 23],
            "göz bakım": 33, "göz kremi": 33, "göz çevresi": 33, "göz nemlendirici": 33, "göz nemlendiricisi": 33,
            "şampuan": 34, "sampuan": 34,
            "saç kremi": 35, "saç bakım": 36, "saç maskesi": 36, "saç yağı": 36,
            "roll on": 37, "deodorant": 37,
            "highlighter": 11, "aydınlatıcı": 11,
            "bronzer": 13,
            "makyaj bazı": 15, "primer": 15,
            "bb krem": 12, "cc krem": 12,
        }
        KEYWORD_CATEGORY_MAP.update(synonym_map)
    except Exception as e:
        print(f"Error loading categories: {e}")

    return CATEGORIES_MAP


def get_market_name(m_id: int) -> str:
    markets = get_markets_map()
    return markets.get(m_id, f"Mağaza #{m_id}")


def find_matching_category_ids(user_message: str) -> list:
    import re
    get_categories_map()
    message_lower = user_message.lower()
    matched_ids = []
    sorted_keywords = sorted(KEYWORD_CATEGORY_MAP.keys(), key=len, reverse=True)

    for keyword in sorted_keywords:
        if len(keyword) <= 4:
            if not re.search(r'\b' + re.escape(keyword) + r'\b', message_lower):
                continue
        else:
            if keyword not in message_lower:
                continue

        cat_val = KEYWORD_CATEGORY_MAP[keyword]
        if isinstance(cat_val, list):
            for cid in cat_val:
                if cid not in matched_ids:
                    matched_ids.append(cid)
        else:
            if cat_val not in matched_ids:
                matched_ids.append(cat_val)

    # Specific area categories (Dudak Bakım, Göz Bakım, Saç Bakım, Güneş Kremi, Makyaj vb.)
    specific_categories = {32, 33, 34, 35, 36, 25, 20, 21, 22, 23, 7, 16, 17, 18, 19, 8, 9, 10, 11, 12, 13, 14, 15, 37}

    # If any specific area category matched, remove generic face moisturizer (27) unless "yüz nemlendirici" was explicitly in message
    if any(cid in specific_categories for cid in matched_ids) and 27 in matched_ids:
        if "yüz nemlendirici" not in message_lower and "yüz kremi" not in message_lower:
            matched_ids.remove(27)

    return matched_ids


def load_onboarding_lookups():
    """Fetches and caches lookup tables for skin types, hair types, and skin concerns."""
    global SKIN_TYPES_LOOKUP, HAIR_TYPES_LOOKUP, SKIN_CONCERNS_LOOKUP
    
    # Initialize with default local fallbacks in case DB is empty or RLS-blocked
    default_skin = {'normal': 1, 'kuru': 2, 'yağlı': 3, 'karma': 4, 'hassas': 5}
    default_hair = {'normal': 1, 'kuru': 2, 'yağlı': 3, 'boyalı': 4, 'ince telli': 5, 'kalın telli': 6, 'kıvırcık': 7, 'kepekli': 8}
    default_concerns = {'akne': 1, 'leke': 2, 'kuruluk': 3, 'siyah nokta': 4, 'kızarıklık': 5, 'yaşlanma karşıtı': 6}

    if not SKIN_TYPES_LOOKUP:
        SKIN_TYPES_LOOKUP.update(default_skin)
    if not HAIR_TYPES_LOOKUP:
        HAIR_TYPES_LOOKUP.update(default_hair)
    if not SKIN_CONCERNS_LOOKUP:
        SKIN_CONCERNS_LOOKUP.update(default_concerns)

    if not supabase_client:
        return

    try:
        # Fetch skin types
        res = supabase_client.table("skin_types").select("id, name").execute()
        if res.data and len(res.data) > 0:
            SKIN_TYPES_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}
            
        # Fetch hair types
        res = supabase_client.table("hair_types").select("id, name").execute()
        if res.data and len(res.data) > 0:
            HAIR_TYPES_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}

        # Fetch skin concerns
        res = supabase_client.table("skin_concerns").select("id, name").execute()
        if res.data and len(res.data) > 0:
            SKIN_CONCERNS_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}
    except Exception as e:
        print(f"Error loading onboarding lookups from DB, using fallback: {e}")


# In-memory profiles fallback cache for unauthenticated/test UUIDs or RLS bypass
IN_MEMORY_PROFILES: Dict[str, dict] = {}

# Global reverse lookup maps
SKIN_TYPES_BY_ID = {1: "normal", 2: "kuru", 3: "yağlı", 4: "karma", 5: "hassas"}
HAIR_TYPES_BY_ID = {1: "normal", 2: "kuru", 3: "yağlı", 4: "boyalı", 5: "ince telli", 6: "kalın telli", 7: "kıvırcık", 8: "kepekli"}

def get_user_profile(user_id: str):
    """
    Fetches the profile of a user from the 'user_profiles' table with relation joins.
    Uses Supabase as the source of truth, with in-memory fallback.
    """
    if not is_valid_uuid(user_id):
        raise ValueError(f"Invalid user_id for Supabase profile lookup: {user_id}")

    memory_prof = IN_MEMORY_PROFILES.get(user_id, {})

    if not supabase_client:
        return memory_prof if memory_prof else None
        
    try:
        # Query user profile with join on skin_types and hair_types
        res = supabase_client.table("user_profiles").select("*, skin_types(name), hair_types(name)").eq("user_id", user_id).execute()
        
        if res.data and len(res.data) > 0:
            profile_row = res.data[0]
            
            # Fetch skin concerns many-to-many
            concerns_res = supabase_client.table("user_skin_concerns").select("skin_concerns(name)").eq("user_id", user_id).execute()
            concerns = []
            if concerns_res.data:
                for c_row in concerns_res.data:
                    c_name = c_row.get("skin_concerns", {}).get("name")
                    if c_name:
                        concerns.append(c_name.lower())
            
            # Map DB fields to application schema
            skin_type_name = profile_row.get("skin_types", {}).get("name") if profile_row.get("skin_types") else None
            hair_type_name = profile_row.get("hair_types", {}).get("name") if profile_row.get("hair_types") else None

            # Fallback to ID lookup if join returned None
            if not skin_type_name and profile_row.get("skin_type_id"):
                skin_type_name = SKIN_TYPES_BY_ID.get(int(profile_row.get("skin_type_id")))
            if not hair_type_name and profile_row.get("hair_type_id"):
                hair_type_name = HAIR_TYPES_BY_ID.get(int(profile_row.get("hair_type_id")))

            # Merge with memory fallback if DB values are missing
            final_skin_type = (skin_type_name.lower() if skin_type_name else None) or memory_prof.get("skin_type")
            final_hair_type = (hair_type_name.lower() if hair_type_name else None) or memory_prof.get("hair_type")
            final_concerns = concerns if concerns else memory_prof.get("skin_concerns", [])

            profile = {
                "user_id": user_id,
                "full_name": profile_row.get("full_name") or memory_prof.get("full_name") or "User",
                "skin_type": final_skin_type,
                "hair_type": final_hair_type,
                "skin_concerns": final_concerns,
                "min_budget": profile_row.get("min_budget") or memory_prof.get("min_budget"),
                "max_budget": profile_row.get("max_budget") or memory_prof.get("max_budget"),
                "onboarding_completed": True if final_skin_type and final_hair_type else profile_row.get("onboarding_completed", False),
            }
            IN_MEMORY_PROFILES[user_id] = profile
            return profile

    except Exception as e:
        print(f"DB profile fetch failed, using memory fallback: {e}")

    return IN_MEMORY_PROFILES.get(user_id)


def update_user_profile(user_id: str, profile_data: dict):
    """
    Inserts or updates the profile of a user in the 'user_profiles' table.
    Gracefully maps skin_type/hair_type strings to foreign key IDs.
    Uses Supabase as the source of truth, with in-memory fallback.
    """
    if not is_valid_uuid(user_id):
        raise ValueError(f"Invalid user_id for Supabase profile update: {user_id}")

    # Always update in-memory profile store first as fallback
    existing = IN_MEMORY_PROFILES.get(user_id, {})
    new_profile = {
        "user_id": user_id,
        "full_name": profile_data.get("full_name") or existing.get("full_name") or "User",
        "skin_type": (profile_data.get("skin_type") or existing.get("skin_type") or "").lower() or None,
        "hair_type": (profile_data.get("hair_type") or existing.get("hair_type") or "").lower() or None,
        "skin_concerns": profile_data.get("skin_concerns", existing.get("skin_concerns", [])),
        "min_budget": profile_data.get("min_budget", existing.get("min_budget")),
        "max_budget": profile_data.get("max_budget", existing.get("max_budget")),
        "onboarding_completed": True if (profile_data.get("skin_type") or existing.get("skin_type")) and (profile_data.get("hair_type") or existing.get("hair_type")) else False,
    }
    IN_MEMORY_PROFILES[user_id] = new_profile

    if not supabase_client:
        return new_profile

    try:
        # Load ID lookups
        load_onboarding_lookups()

        skin_type_str = (new_profile.get("skin_type") or "").lower()
        hair_type_str = (new_profile.get("hair_type") or "").lower()

        # Find matching ID or use None
        skin_type_id = SKIN_TYPES_LOOKUP.get(skin_type_str)
        hair_type_id = HAIR_TYPES_LOOKUP.get(hair_type_str)

        # Build payload for user_profiles table
        profile_payload = {
            "user_id": user_id,
            "skin_type_id": skin_type_id,
            "hair_type_id": hair_type_id,
            "min_budget": new_profile.get("min_budget"),
            "max_budget": new_profile.get("max_budget"),
            "onboarding_completed": True if skin_type_id and hair_type_id else False,
        }

        # Check if profile already exists in DB
        check_res = supabase_client.table("user_profiles").select("user_id").eq("user_id", user_id).execute()
        
        if check_res.data and len(check_res.data) > 0:
            supabase_client.table("user_profiles").update(profile_payload).eq("user_id", user_id).execute()
        else:
            supabase_client.table("user_profiles").insert(profile_payload).execute()

        # Handle skin concerns many-to-many relation
        skin_concerns = new_profile.get("skin_concerns", [])
        if skin_concerns:
            # Delete existing concerns for this user
            supabase_client.table("user_skin_concerns").delete().eq("user_id", user_id).execute()
            
            # Map names to IDs and insert
            concerns_payload = []
            for c_name in skin_concerns:
                c_id = SKIN_CONCERNS_LOOKUP.get(c_name.lower())
                if c_id:
                    concerns_payload.append({
                        "user_id": user_id,
                        "skin_concern_id": c_id
                    })
            if concerns_payload:
                supabase_client.table("user_skin_concerns").insert(concerns_payload).execute()

        print(f"Successfully saved profile for user {user_id} to DB")
        return get_user_profile(user_id)
        
    except Exception as e:
        print(f"Error updating user profile in DB (using in-memory profile): {e}")
        return new_profile


def search_products_by_keyword(user_message: str, match_count: int = 3, exclude_ids: list = None):
    if not supabase_client:
        return []

    try:
        category_ids = find_matching_category_ids(user_message)
        exclude_str_ids = [str(x) for x in (exclude_ids or [])]

        if category_ids:
            products_response = (
                supabase_client
                .table("products")
                .select("id, brand_id, category_id, universal_name, image_url")
                .in_("category_id", category_ids)
                .limit(100)
                .execute()
            )
        else:
            products_response = (
                supabase_client
                .table("products")
                .select("id, brand_id, category_id, universal_name, image_url")
                .limit(100)
                .execute()
            )

        raw_products = products_response.data or []
        if not raw_products:
            return []

        if exclude_str_ids:
            filtered = [p for p in raw_products if str(p["id"]) not in exclude_str_ids]
            if filtered:
                raw_products = filtered

        msg_lower = user_message.lower()
        if any(k in msg_lower for k in ["farklı", "başka", "değişik", "diğer", "yeni"]) or exclude_str_ids:
            import random
            random.shuffle(raw_products)

        raw_products = raw_products[:match_count]

        markets = get_markets_map()
        result = []

        for product in raw_products:
            store_response = (
                supabase_client
                .table("store_mappings")
                .select("*")
                .eq("p_id", product["id"])
                .execute()
            )
            stores = store_response.data if store_response.data else []

            for store in stores:
                store["market_name"] = markets.get(store.get("m_id"), f"Mağaza #{store.get('m_id')}")

            stores.sort(key=lambda s: s.get("current_price") or 99999)

            product["store_mappings"] = stores
            product["category_name"] = CATEGORIES_MAP.get(product.get("category_id"), "Bilinmiyor")
            result.append(product)

        return result

    except Exception as e:
        print(f"Keyword-based product search failed: {e}")
        return []
def search_products_for_profile(
    user_message: str,
    profile: dict,
    match_count: int = 3
):
    """
    Kullanıcının mesajı ve profil bilgilerine göre ürünleri puanlayarak getirir.

    Eşleşme puanları:
    - Cilt tipi eşleşmesi: +3
    - Her cilt problemi eşleşmesi: +2
    - Saç tipi eşleşmesi: +2

    Kullanıcının bütçe aralığı varsa ürünün en düşük mağaza fiyatı
    bu aralığa göre filtrelenir.
    """

    if not supabase_client:
        return []

    try:
        load_onboarding_lookups()
        get_categories_map()

        category_ids = find_matching_category_ids(user_message)

        product_query = (
            supabase_client
            .table("products")
            .select(
                "id, brand_id, category_id, universal_name, image_url"
            )
        )

        if category_ids:
            product_query = product_query.in_(
                "category_id",
                category_ids
            )

        product_response = product_query.limit(100).execute()
        products = product_response.data or []

        if not products:
            return []

        skin_type = (profile.get("skin_type") or "").lower()
        hair_type = (profile.get("hair_type") or "").lower()
        skin_concerns = profile.get("skin_concerns", [])

        skin_type_id = SKIN_TYPES_LOOKUP.get(skin_type)
        hair_type_id = HAIR_TYPES_LOOKUP.get(hair_type)

        skin_concern_ids = []

        for concern in skin_concerns:
            concern_id = SKIN_CONCERNS_LOOKUP.get(
                str(concern).lower()
            )

            if concern_id:
                skin_concern_ids.append(concern_id)

        min_budget = profile.get("min_budget")
        max_budget = profile.get("max_budget")

        markets = get_markets_map()
        results = []

        for product in products:
            product_id = product["id"]
            match_score = 0

            # Cilt tipi eşleşmesi
            if skin_type_id:
                skin_type_response = (
                    supabase_client
                    .table("product_skin_types")
                    .select("product_id")
                    .eq("product_id", product_id)
                    .eq("skin_type_id", skin_type_id)
                    .execute()
                )

                if skin_type_response.data:
                    match_score += 3

            # Cilt problemleri eşleşmesi
            if skin_concern_ids:
                concern_response = (
                    supabase_client
                    .table("product_skin_concerns")
                    .select("skin_concern_id")
                    .eq("product_id", product_id)
                    .in_("skin_concern_id", skin_concern_ids)
                    .execute()
                )

                match_score += len(concern_response.data or []) * 2

            # Saç tipi eşleşmesi
            if hair_type_id:
                hair_type_response = (
                    supabase_client
                    .table("product_hair_types")
                    .select("product_id")
                    .eq("product_id", product_id)
                    .eq("hair_type_id", hair_type_id)
                    .execute()
                )

                if hair_type_response.data:
                    match_score += 2

            # Mağaza ve fiyat bilgileri
            store_response = (
                supabase_client
                .table("store_mappings")
                .select("*")
                .eq("p_id", product_id)
                .execute()
            )

            stores = store_response.data or []

            for store in stores:
                store["market_name"] = markets.get(
                    store.get("m_id"),
                    f"Mağaza #{store.get('m_id')}"
                )

            stores.sort(
                key=lambda store: (
                    store.get("current_price")
                    if store.get("current_price") is not None
                    else 999999
                )
            )

            valid_prices = [
                float(store["current_price"])
                for store in stores
                if store.get("current_price") is not None
                and float(store["current_price"]) > 0
            ]

            lowest_price = min(valid_prices) if valid_prices else None

            # Bütçe kontrolü
            if lowest_price is not None:
                if (
                    min_budget is not None
                    and lowest_price < float(min_budget)
                ):
                    continue

                if (
                    max_budget is not None
                    and lowest_price > float(max_budget)
                ):
                    continue

            product["store_mappings"] = stores
            product["category_name"] = CATEGORIES_MAP.get(
                product.get("category_id"),
                "Bilinmiyor"
            )
            product["match_score"] = match_score
            product["lowest_price"] = lowest_price

            results.append(product)

        # Önce eşleşme puanı yüksek, sonra fiyatı düşük olanlar
        results.sort(
            key=lambda product: (
                -product.get("match_score", 0),
                (
                    product.get("lowest_price")
                    if product.get("lowest_price") is not None
                    else 999999
                )
            )
        )

        return results[:match_count]

    except Exception as e:
        print(f"Profile-based product search failed: {e}")
        return []

def match_products(query_embedding: list, match_threshold: float = 0.15, match_count: int = 3):
    if not supabase_client:
        return []

    try:
        response = supabase_client.rpc("match_products", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count
        }).execute()

        if response.data:
            markets = get_markets_map()
            products_with_stores = []
            for product in response.data:
                product_id = product.get("id")
                store_response = supabase_client.table("store_mappings").select("*").eq("p_id", product_id).execute()
                stores = store_response.data if store_response.data else []

                for store in stores:
                    store["market_name"] = markets.get(store.get("m_id"), f"Mağaza #{store.get('m_id')}")
                stores.sort(key=lambda s: s.get("current_price") or 99999)

                product["store_mappings"] = stores
                products_with_stores.append(product)
            return products_with_stores
    except Exception as e:
        print(f"RPC match_products failed: {e}. Using keyword search fallback...")

    return []


def search_products_by_profile(
    profile: dict,
    user_message: str,
    match_count: int = 3,
    exclude_ids: list = None,
<<<<<<< HEAD
    allow_out_of_stock: bool = False,
    store_name: str = None
=======
    allow_out_of_stock: bool = False
>>>>>>> 183307c550005a497f9ff243c3b2146c882bc377
) -> list:
    """
    Finds products that match the user's skin/hair profile and query category.
    Supports exclude_ids for dynamic rotation and allow_out_of_stock for stock filtering.
    """
    if not supabase_client:
        return search_products_by_keyword(user_message, match_count, exclude_ids=exclude_ids)

    try:
        load_onboarding_lookups()
        get_categories_map()

        exclude_str_ids = [str(x) for x in (exclude_ids or [])]

        # 1. Identify category from user message
        category_ids = find_matching_category_ids(user_message)

        if not category_ids:
            return []

        # 2. Get profile IDs
        skin_type_str = (profile.get("skin_type") or "").lower()
        hair_type_str = (profile.get("hair_type") or "").lower()

        skin_type_id = SKIN_TYPES_LOOKUP.get(skin_type_str)
        hair_type_id = HAIR_TYPES_LOOKUP.get(hair_type_str)

        matched_p_ids = set()

        if skin_type_id:
            res = supabase_client.table("product_skin_types").select("product_id").eq("skin_type_id", skin_type_id).execute()
            if res.data:
                matched_p_ids.update(row["product_id"] for row in res.data)

        if hair_type_id:
            res = supabase_client.table("product_hair_types").select("product_id").eq("hair_type_id", hair_type_id).execute()
            if res.data:
                ht_pids = set(row["product_id"] for row in res.data)
                if matched_p_ids:
                    is_hair_query = any(cid in [34, 35, 36] for cid in category_ids)
                    if is_hair_query:
                        matched_p_ids.intersection_update(ht_pids)
                else:
                    matched_p_ids.update(ht_pids)

        # 3. Fetch up to 100 candidate products from DB
        query = supabase_client.table("products").select("id, brand_id, category_id, universal_name, image_url").in_("category_id", category_ids)
        
        if matched_p_ids:
            query = query.in_("id", list(matched_p_ids))
            
        products_response = query.limit(100).execute()
        raw_products = products_response.data or []

        # If no profile-matched products, fetch general category candidates
        if not raw_products:
            gen_query = supabase_client.table("products").select("id, brand_id, category_id, universal_name, image_url").in_("category_id", category_ids).limit(100).execute()
            raw_products = gen_query.data or []

        if not raw_products:
            return []

        # Exclude previously shown products if exclude_ids specified
        if exclude_str_ids:
            filtered = [p for p in raw_products if str(p["id"]) not in exclude_str_ids]
            if filtered:
                raw_products = filtered

        markets = get_markets_map()
        result = []

        for product in raw_products:
            store_response = supabase_client.table("store_mappings").select("*").eq("p_id", product["id"]).execute()
            stores = store_response.data if store_response.data else []

            for store in stores:
                store["market_name"] = markets.get(store.get("m_id"), f"Mağaza #{store.get('m_id')}")
            stores.sort(key=lambda s: s.get("current_price") or 99999)

            valid_prices = [
                float(s["current_price"]) for s in stores
                if s.get("current_price") is not None and float(s["current_price"]) > 0
            ]

            lowest_price = min(valid_prices) if valid_prices else None

            # Out of stock filter check
            if not allow_out_of_stock and lowest_price is None:
                # Unless allow_out_of_stock is requested, prioritize products with valid prices
                pass

            product["store_mappings"] = stores
            product["category_name"] = CATEGORIES_MAP.get(product.get("category_id"), "Bilinmiyor")
            product["lowest_price"] = lowest_price
            product["is_out_of_stock"] = lowest_price is None
            result.append(product)

        # Check if user explicitly wants out-of-stock products
        msg_lower = user_message.lower()
        wants_out_of_stock = "stok dışı" in msg_lower or "stokta olmayan" in msg_lower or "stokta yok" in msg_lower
        
        if wants_out_of_stock:
            # Filter for out of stock products
            out_of_stock_prods = [p for p in result if p["is_out_of_stock"]]
            if out_of_stock_prods:
                result = out_of_stock_prods

        # Dynamic rotation / shuffling if user asked for "farklı", "başka", "değişik", "diğer"
        wants_different = any(k in msg_lower for k in ["farklı", "başka", "değişik", "diğer", "yeni"])
        if wants_different or exclude_str_ids:
            import random
            random.shuffle(result)

        return result[:match_count]

    except Exception as e:
        print(f"Profile-based product search failed: {e}. Falling back to category search...")
        return search_products_by_keyword(user_message, match_count, exclude_ids=exclude_ids)


def get_product_by_id(product_id: int) -> Optional[dict]:
    """Fetches a single product and its store mappings from Supabase."""
    if not supabase_client:
        return None
    try:
        res = supabase_client.table("products").select("id, brand_id, category_id, universal_name, image_url").eq("id", product_id).execute()
        if not res.data:
            return None
        product = res.data[0]
        
        markets = get_markets_map()
        store_res = supabase_client.table("store_mappings").select("*").eq("p_id", product_id).execute()
        stores = store_res.data if store_res.data else []
        for store in stores:
            store["market_name"] = markets.get(store.get("m_id"), f"Mağaza #{store.get('m_id')}")
        stores.sort(key=lambda s: s.get("current_price") or 99999)
        
        product["store_mappings"] = stores
        product["category_name"] = get_categories_map().get(product.get("category_id"), "Bilinmiyor")
        return product
    except Exception as e:
        print(f"Error fetching product by ID {product_id}: {e}")
        return None


def get_product_by_name(name: str) -> Optional[dict]:
    """Finds a product by name using exact or partial matching from Supabase."""
    if not supabase_client or not name:
        return None
    try:
        res = supabase_client.table("products").select("id, brand_id, category_id, universal_name, image_url").ilike("universal_name", f"%{name}%").limit(1).execute()
        if not res.data:
            return None
        return get_product_by_id(res.data[0]["id"])
    except Exception as e:
        print(f"Error fetching product by name {name}: {e}")
        return None


def get_product_alternatives(
    product_id: int,
    profile: dict,
    store_name: Optional[str] = None,
    cheaper_than: Optional[float] = None,
    match_count: int = 3
) -> list:
    """
    Finds alternative products in the same category as the reference product.
    Filters:
    - Same category
    - Exclude the reference product itself
    - Optionally filter by store_name (case-insensitive)
    - Optionally filter by cheaper_than (price must be less than cheaper_than)
    - Personalizes the order based on profile skin/hair type match.
    """
    if not supabase_client:
        return []
    
    try:
        # 1. Fetch reference product to get category
        ref_product = get_product_by_id(product_id)
        if not ref_product:
            return []
        
        category_id = ref_product.get("category_id")
        if not category_id:
            return []
            
        # 2. Query products in the same category
        query = supabase_client.table("products").select("id, brand_id, category_id, universal_name, image_url").eq("category_id", category_id).neq("id", product_id)
        res = query.limit(50).execute()
        candidates = res.data or []
        if not candidates:
            return []
            
        # Map store name to m_id if provided
        target_m_id = None
        if store_name:
            markets = get_markets_map()
            for m_id, m_name in markets.items():
                if m_name.lower() == store_name.lower():
                    target_m_id = m_id
                    break
        
        load_onboarding_lookups()
        categories = get_categories_map()
        
        # Profile matching IDs
        skin_type = (profile.get("skin_type") or "").lower()
        hair_type = (profile.get("hair_type") or "").lower()
        skin_concerns = profile.get("skin_concerns", [])
        
        skin_type_id = SKIN_TYPES_LOOKUP.get(skin_type)
        hair_type_id = HAIR_TYPES_LOOKUP.get(hair_type)
        
        skin_concern_ids = [SKIN_CONCERNS_LOOKUP.get(c.lower()) for c in skin_concerns if SKIN_CONCERNS_LOOKUP.get(c.lower())]
        
        markets = get_markets_map()
        results = []
        
        for p in candidates:
            p_id = p["id"]
            
            # Fetch store mappings for this candidate
            store_res = supabase_client.table("store_mappings").select("*").eq("p_id", p_id).execute()
            stores = store_res.data or []
            
            # Apply store filter
            if target_m_id is not None:
                stores = [s for s in stores if s.get("m_id") == target_m_id]
                if not stores:
                    continue
            
            for s in stores:
                s["market_name"] = markets.get(s.get("m_id"), f"Mağaza #{s.get('m_id')}")
            
            # Find cheapest price
            valid_prices = [
                float(s["current_price"]) for s in stores 
                if s.get("current_price") is not None and float(s["current_price"]) > 0
            ]
            
            lowest_price = min(valid_prices) if valid_prices else None
            
            # Apply cheaper_than filter
            if cheaper_than is not None:
                if lowest_price is None or lowest_price >= float(cheaper_than):
                    continue
            
            # Calculate match score based on user profile
            match_score = 0
            
            if skin_type_id:
                skin_res = supabase_client.table("product_skin_types").select("product_id").eq("product_id", p_id).eq("skin_type_id", skin_type_id).execute()
                if skin_res.data:
                    match_score += 3
                    
            if skin_concern_ids:
                concern_res = supabase_client.table("product_skin_concerns").select("skin_concern_id").eq("product_id", p_id).in_("skin_concern_id", skin_concern_ids).execute()
                match_score += len(concern_res.data or []) * 2
                
            if hair_type_id:
                hair_res = supabase_client.table("product_hair_types").select("product_id").eq("product_id", p_id).eq("hair_type_id", hair_type_id).execute()
                if hair_res.data:
                    match_score += 2
                    
            stores.sort(key=lambda s: s.get("current_price") or 99999)
            p["store_mappings"] = stores
            p["category_name"] = categories.get(category_id, "Bilinmiyor")
            p["match_score"] = match_score
            p["lowest_price"] = lowest_price
            
            results.append(p)
            
        # Sort results: profile match score descending, lowest price ascending
        results.sort(key=lambda x: (-x.get("match_score", 0), x.get("lowest_price") or 99999))
        return results[:match_count]
        
    except Exception as e:
        print(f"Error getting product alternatives for {product_id}: {e}")
        return []


