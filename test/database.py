import os
import json
import math
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

supabase_client: Client = None

# In-memory mock fallback store for user profiles during testing
MOCK_USER_PROFILES = {}

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

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("Supabase client successfully initialized.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
else:
    print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY not found. Database connection inactive.")


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
            "nemlendirici": 27, "nem": 27, "moisturizer": 27,
            "serum": 30, "yüz serumu": 30,
            "güneş kremi": 25, "spf": 25, "güneş koruyucu": 25,
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
            "tonik": 24, "toner": 24, "temizleyici": 24, "temizleme": 24,
            "maske": 29, "yüz maskesi": 29,
            "peeling": 31,
            "dudak": 7, "dudak bakım": 32,
            "göz bakım": 33, "göz kremi": 33,
            "şampuan": 34, "sampuan": 34,
            "saç kremi": 35, "saç bakım": 36,
            "roll on": 37, "deodorant": 37,
            "highlighter": 11, "aydınlatıcı": 11,
            "bronzer": 13,
            "makyaj bazı": 15, "primer": 15,
            "bb krem": 12, "cc krem": 12,
            "dudak kalemi": 22, "lip liner": 22,
            "dudak parlatıcı": 23, "lip gloss": 23,
            "yaşlanma karşıtı": 28, "anti aging": 28, "kırışıklık": 28,
        }
        KEYWORD_CATEGORY_MAP.update(synonym_map)
    except Exception as e:
        print(f"Error loading categories: {e}")

    return CATEGORIES_MAP


def get_market_name(m_id: int) -> str:
    markets = get_markets_map()
    return markets.get(m_id, f"Mağaza #{m_id}")


def find_matching_category_ids(user_message: str) -> list:
    get_categories_map()
    message_lower = user_message.lower()
    matched_ids = []
    sorted_keywords = sorted(KEYWORD_CATEGORY_MAP.keys(), key=len, reverse=True)

    for keyword in sorted_keywords:
        if keyword in message_lower:
            cat_id = KEYWORD_CATEGORY_MAP[keyword]
            if cat_id not in matched_ids:
                matched_ids.append(cat_id)

    return matched_ids


def load_onboarding_lookups():
    """Fetches and caches lookup tables for skin types, hair types, and skin concerns."""
    global SKIN_TYPES_LOOKUP, HAIR_TYPES_LOOKUP, SKIN_CONCERNS_LOOKUP
    if SKIN_TYPES_LOOKUP and HAIR_TYPES_LOOKUP and SKIN_CONCERNS_LOOKUP:
        return

    if not supabase_client:
        return

    try:
        # Fetch skin types
        res = supabase_client.table("skin_types").select("id, name").execute()
        if res.data:
            SKIN_TYPES_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}
            
        # Fetch hair types
        res = supabase_client.table("hair_types").select("id, name").execute()
        if res.data:
            HAIR_TYPES_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}

        # Fetch skin concerns
        res = supabase_client.table("skin_concerns").select("id, name").execute()
        if res.data:
            SKIN_CONCERNS_LOOKUP = {row["name"].lower(): row["id"] for row in res.data}
    except Exception as e:
        print(f"Error loading onboarding lookups from DB: {e}")


def get_user_profile(user_id: str):
    """
    Fetches the profile of a user from the 'user_profiles' table with relation joins.
    Falls back to in-memory store if the user_id is not a valid UUID or DB query fails.
    """
    if not is_valid_uuid(user_id):
        # Graceful fallback to mock store for non-UUID strings
        return MOCK_USER_PROFILES.get(user_id)

    if not supabase_client:
        return MOCK_USER_PROFILES.get(user_id)
        
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

            profile = {
                "user_id": user_id,
                "full_name": profile_row.get("full_name") or "User",
                "skin_type": skin_type_name.lower() if skin_type_name else None,
                "hair_type": hair_type_name.lower() if hair_type_name else None,
                "skin_concerns": concerns,
                "min_budget": profile_row.get("min_budget"),
                "max_budget": profile_row.get("max_budget"),
                "onboarding_completed": profile_row.get("onboarding_completed", False),
            }
            # Sync to local mock cache
            MOCK_USER_PROFILES[user_id] = profile
            return profile
            
    except Exception as e:
        print(f"DB profile fetch failed or RLS blocked (using mock fallback): {e}")
        
    return MOCK_USER_PROFILES.get(user_id)


def update_user_profile(user_id: str, profile_data: dict):
    """
    Inserts or updates the profile of a user in the 'user_profiles' table.
    Gracefully maps skin_type/hair_type strings to foreign key IDs.
    Falls back to in-memory store if the user_id is not a valid UUID or DB query fails.
    """
    # Save to mock memory first
    MOCK_USER_PROFILES[user_id] = {
        "user_id": user_id,
        "full_name": profile_data.get("full_name") or "User",
        "skin_type": profile_data.get("skin_type"),
        "hair_type": profile_data.get("hair_type"),
        "skin_concerns": profile_data.get("skin_concerns", []),
        "min_budget": profile_data.get("min_budget"),
        "max_budget": profile_data.get("max_budget"),
    }

    if not is_valid_uuid(user_id):
        # Graceful fallback to mock store for non-UUID strings
        return MOCK_USER_PROFILES[user_id]

    if not supabase_client:
        return MOCK_USER_PROFILES[user_id]

    try:
        # Load ID lookups
        load_onboarding_lookups()

        skin_type_str = (profile_data.get("skin_type") or "").lower()
        hair_type_str = (profile_data.get("hair_type") or "").lower()

        # Find matching ID or use None
        skin_type_id = SKIN_TYPES_LOOKUP.get(skin_type_str)
        hair_type_id = HAIR_TYPES_LOOKUP.get(hair_type_str)

        # Build payload for user_profiles table
        profile_payload = {
            "user_id": user_id,
            "skin_type_id": skin_type_id,
            "hair_type_id": hair_type_id,
            "min_budget": profile_data.get("min_budget"),
            "max_budget": profile_data.get("max_budget"),
            "onboarding_completed": True if skin_type_id and hair_type_id else False,
        }

        # Check if profile already exists in DB
        check_res = supabase_client.table("user_profiles").select("user_id").eq("user_id", user_id).execute()
        
        if check_res.data and len(check_res.data) > 0:
            supabase_client.table("user_profiles").update(profile_payload).eq("user_id", user_id).execute()
        else:
            supabase_client.table("user_profiles").insert(profile_payload).execute()

        # Handle skin concerns many-to-many relation
        skin_concerns = profile_data.get("skin_concerns", [])
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
        print(f"Error updating user profile in DB (saved in memory fallback): {e}")

    return MOCK_USER_PROFILES[user_id]


def search_products_by_keyword(user_message: str, match_count: int = 3):
    if not supabase_client:
        return []

    try:
        category_ids = find_matching_category_ids(user_message)

        if category_ids:
            products_response = (
                supabase_client
                .table("products")
                .select("id, brand_id, category_id, universal_name, image_url")
                .in_("category_id", category_ids)
                .limit(match_count)
                .execute()
            )
        else:
            products_response = (
                supabase_client
                .table("products")
                .select("id, brand_id, category_id, universal_name, image_url")
                .limit(match_count)
                .execute()
            )

        if not products_response.data:
            return []

        markets = get_markets_map()
        result = []

        for product in products_response.data:
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
