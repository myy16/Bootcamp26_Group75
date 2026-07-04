import os
import json
import math
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

if SUPABASE_URL and SUPABASE_ANON_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("Supabase client successfully initialized.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
else:
    print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY not found. Database connection inactive.")


def get_markets_map() -> dict:
    """
    Fetches market names from the 'markets' table and caches them.
    Returns dict like {1: 'Watsons', 2: 'Gratis', 3: 'Mion', 4: 'Rossmann'}
    """
    global MARKETS_MAP
    if MARKETS_MAP:
        return MARKETS_MAP

    if not supabase_client:
        # Hardcoded fallback matching actual DB values
        MARKETS_MAP = {1: "Watsons", 2: "Gratis", 3: "Mion", 4: "Rossmann"}
        return MARKETS_MAP

    try:
        response = supabase_client.table("markets").select("*").execute()
        if response.data:
            for row in response.data:
                MARKETS_MAP[row["id"]] = row["name"].title()
        print(f"Markets map loaded: {MARKETS_MAP}")
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

                # Build keyword mapping (category name words -> category id)
                words = cat_name.lower().replace("ı", "i").replace("ö", "o").replace("ü", "u").replace("ş", "s").replace("ç", "c").replace("ğ", "g")
                KEYWORD_CATEGORY_MAP[cat_name.lower()] = cat_id

        # Add common user-facing Turkish synonyms -> category_id
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

        print(f"Categories map loaded: {len(CATEGORIES_MAP)} categories")
    except Exception as e:
        print(f"Error loading categories: {e}")

    return CATEGORIES_MAP


def get_market_name(m_id: int) -> str:
    """Returns the properly capitalized market name for a given market ID."""
    markets = get_markets_map()
    return markets.get(m_id, f"Mağaza #{m_id}")


def find_matching_category_ids(user_message: str) -> list:
    """
    Extracts category IDs from user message using keyword matching.
    Returns a list of matching category_ids.
    """
    # Ensure categories are loaded
    get_categories_map()

    message_lower = user_message.lower()
    matched_ids = []

    # Sort keywords by length (longest first) for greedy matching
    sorted_keywords = sorted(KEYWORD_CATEGORY_MAP.keys(), key=len, reverse=True)

    for keyword in sorted_keywords:
        if keyword in message_lower:
            cat_id = KEYWORD_CATEGORY_MAP[keyword]
            if cat_id not in matched_ids:
                matched_ids.append(cat_id)

    return matched_ids


def get_user_profile(user_id: str):
    """
    Fetches the profile of a user from the 'user_profiles' table.
    Falls back to in-memory store if the table or connection is missing.
    """
    if not supabase_client:
        return MOCK_USER_PROFILES.get(user_id)
    try:
        response = supabase_client.table("user_profiles").select("*").eq("user_id", user_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]
        return MOCK_USER_PROFILES.get(user_id)
    except Exception as e:
        print(f"Error fetching user profile for {user_id} from DB (falling back to memory): {e}")
        return MOCK_USER_PROFILES.get(user_id)


def update_user_profile(user_id: str, profile_data: dict):
    """
    Inserts or updates the profile of a user in the 'user_profiles' table.
    Falls back to in-memory store if the database operation fails.
    """
    MOCK_USER_PROFILES[user_id] = {
        "user_id": user_id,
        "full_name": profile_data.get("full_name") or "User",
        "skin_type": profile_data.get("skin_type"),
        "hair_type": profile_data.get("hair_type"),
        "skin_concerns": profile_data.get("skin_concerns", []),
    }

    if not supabase_client:
        return MOCK_USER_PROFILES[user_id]

    try:
        existing = get_user_profile(user_id)
        data_to_save = MOCK_USER_PROFILES[user_id].copy()

        if existing:
            response = supabase_client.table("user_profiles").update(data_to_save).eq("user_id", user_id).execute()
        else:
            response = supabase_client.table("user_profiles").insert(data_to_save).execute()

        if response.data and len(response.data) > 0:
            print(f"Successfully saved profile for user {user_id} to DB")
            return response.data[0]
    except Exception as e:
        print(f"Error updating user profile for {user_id} in DB (saved in memory): {e}")

    return MOCK_USER_PROFILES[user_id]


def search_products_by_keyword(user_message: str, match_count: int = 3):
    """
    Searches products by matching user message keywords to categories.
    Falls back to first N products if no keyword match.
    Returns products with their store_mappings and market names resolved.
    """
    if not supabase_client:
        return []

    try:
        category_ids = find_matching_category_ids(user_message)

        if category_ids:
            # Query products in matched categories
            products_response = (
                supabase_client
                .table("products")
                .select("id, brand_id, category_id, universal_name, image_url")
                .in_("category_id", category_ids)
                .limit(match_count)
                .execute()
            )
        else:
            # No category match, return first N products as fallback
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

            # Resolve market names and sort by price
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


def match_products(query_embedding: list, match_threshold: float = 0.15, match_count: int = 3):
    """
    Finds products similar to the query embedding.
    Tries the Supabase RPC function first, and falls back to keyword search.
    """
    if not supabase_client:
        return []

    # Try calling Supabase RPC match_products
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

    # Fallback: return empty, caller should use search_products_by_keyword instead
    return []
