import os
import re
import json
from pathlib import Path
from datetime import date
from urllib.parse import urlparse, parse_qs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pyairbnb
from geopy.geocoders import Nominatim
import google.genai as genai
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RETRY WRAPPERS (The New Addition) ---

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
def fetch_price_with_retry(room_id, check_in, check_out):
    return pyairbnb.get_price(room_id=room_id, check_in=check_in, check_out=check_out)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
def fetch_details_with_retry(room_url):
    return pyairbnb.get_details(room_url=room_url, currency="USD", language="en")

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=4, max=10),
    reraise=True
)
def generate_content_with_retry(client, model, contents):
    return client.models.generate_content(model=model, contents=contents)

# --- MODELS ---

class ScrapeRequest(BaseModel):
    url: str

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

class SuggestRequest(BaseModel):
    listing_details: list[dict]
    trip_details: dict

class FillListing(BaseModel):
    url: str
    price_data: dict | None = None
    details: dict

class FillRequest(BaseModel):
    categories: list[dict]
    listings: list[FillListing]
    trip_details: dict | None = None

class RecommendListing(BaseModel):
    title: str
    url: str
    details: dict
    fill_values: dict | None = None

class RecommendRequest(BaseModel):
    trip_details: dict
    listings: list[RecommendListing]
    winners: dict | None = None

class SummarizeRequest(BaseModel):
    reviews: list[str]
    listing_title: str = ""

class AskMessage(BaseModel):
    role: str
    content: str

class AskRequest(BaseModel):
    question: str
    history: list[AskMessage] = []
    listings: list[dict]
    categories: list[dict] = []
    winners: dict | None = None
    trip_details: dict | None = None
    review_summaries: list[str | None] = []
    recommendation: dict | None = None

# --- HELPERS ---

def extract_room_id(url: str) -> str | None:
    match = re.search(r"/rooms/(\d+)", url)
    return match.group(1) if match else None

def extract_dates(url: str) -> tuple[date | None, date | None]:
    params = parse_qs(urlparse(url).query)
    try:
        check_in = date.fromisoformat(params["check_in"][0]) if "check_in" in params else None
        check_out = date.fromisoformat(params["check_out"][0]) if "check_out" in params else None
        return check_in, check_out
    except (ValueError, IndexError):
        return None, None

def optimize_listing_for_llm(raw_data: dict) -> dict:
    coords = raw_data.get("coordinates", {})
    host_rating = (
        raw_data.get("host_details", {}).get("data", {}).get("node", {})
        .get("hostRatingStats", {}).get("ratingAverage")
    )

    optimized = {
        "title": raw_data.get("title", ""),
        "description": raw_data.get("description", ""),
        "room_type": raw_data.get("room_type", ""),
        "is_super_host": raw_data.get("is_super_host", False),
        "is_guest_favorite": raw_data.get("is_guest_favorite", False),
        "home_tier": raw_data.get("home_tier", ""),
        "person_capacity": raw_data.get("person_capacity", 0),
        "rating": raw_data.get("rating", {}),
        "host_rating": host_rating,
        "host": raw_data.get("host", {}),
        "sub_description": raw_data.get("sub_description", {}),
        "coordinates": {
            "latitude": coords.get("latitude"),
            "longitude": coords.get("longitude"),
        },
    }

    optimized["highlights"] = [
        {"title": hl.get("title"), "subtitle": hl.get("subtitle")}
        for hl in raw_data.get("highlights", [])
    ]

    house_rules_raw = raw_data.get("house_rules", {})
    optimized["house_rules"] = {
        "general_rules": [
            rule.get("title")
            for category in house_rules_raw.get("general", [])
            for rule in category.get("values", [])
        ],
        "additional_details": house_rules_raw.get("aditional", ""),
    }

    amenities = []
    for category in raw_data.get("amenities", []):
        cat_title = category.get("title", "Other")
        for item in category.get("values", []):
            if item.get("available", False):
                name = item.get("title", "")
                desc = item.get("subtitle", "")
                amenities.append(f"{cat_title}: {name} - {desc}" if desc else f"{cat_title}: {name}")
    optimized["available_amenities"] = amenities

    comments = []
    for review in raw_data.get("reviews", []):
        comment = review.get("comments")
        if comment:
            comments.append(comment.replace("<br/>", " ").replace("<br />", " ").replace("\n", " "))
    optimized["review_comments"] = comments

    return optimized

# --- ENDPOINTS ---

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/scrape")
def scrape(req: ScrapeRequest):
    room_id = extract_room_id(req.url)
    if not room_id:
        raise HTTPException(status_code=400, detail="Could not extract room ID from URL.")

    check_in, check_out = extract_dates(req.url)
    if not check_in or not check_out:
        raise HTTPException(
            status_code=400,
            detail="URL must include check_in and check_out dates (e.g. ...&check_in=2026-04-01&check_out=2026-04-04).",
        )

    try:
        price_data = fetch_price_with_retry(room_id, check_in, check_out)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch price after retries: {str(e)}")

    main = price_data.get("main", {})
    return {
        "room_id": room_id,
        "check_in": str(check_in),
        "check_out": str(check_out),
        "total": main.get("discountedPrice") or main.get("price"),
        "original_price": main.get("originalPrice"),
        "qualifier": main.get("qualifier"),
        "breakdown": main.get("details", {}),
    }

@app.post("/details")
def details(req: ScrapeRequest):
    room_id = extract_room_id(req.url)
    if not room_id:
        raise HTTPException(status_code=400, detail="Could not extract room ID from URL.")

    try:
        raw = fetch_details_with_retry(f"https://www.airbnb.com/rooms/{room_id}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch details after retries: {str(e)}")

    return optimize_listing_for_llm(raw)

@app.post("/location")
def location(req: LocationRequest):
    try:
        geolocator = Nominatim(user_agent="comparebnb")
        result = geolocator.reverse(f"{req.latitude}, {req.longitude}")
        return {"display_name": result.raw.get("display_name") if result else None}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Geocoding failed: {str(e)}")

@app.post("/suggest")
def suggest(req: SuggestRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
    listings_summary = "\n\n".join(
        f"Listing {i + 1}:\n{json.dumps(d, indent=2)}"
        for i, d in enumerate(req.listing_details)
    )

    prompt = f"""You are helping someone compare Airbnb listings. Based on the listing data and trip details below, suggest 6-8 comparison categories that would be most useful for their decision.

Trip details: {json.dumps(req.trip_details, indent=2)}

Listings:
{listings_summary}

Return a JSON array of category objects. Each must have:
- "id": snake_case identifier (e.g. "hot_tub", "pool_access")
- "label": human-readable label (e.g. "Hot Tub", "Pool Access")
- "type": one of "string", "number", "boolean", "price"

Focus on categories that differ between listings or are particularly relevant to the trip. Do not include: listing_name, total_price, location, bedrooms, host_rating. Return ONLY valid JSON, no explanation."""

    try:
        response = generate_content_with_retry(client, "gemini-2.0-flash", prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
            text = text.strip()
        categories = json.loads(text)
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Suggestion failed: {str(e)}")

@app.post("/fill")
def fill_categories(req: FillRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
    n = len(req.listings)

    listings_text = "\n\n".join(
        f"Listing {i + 1}:\nURL: {l.url}\nPrice data: {json.dumps(l.price_data)}\nDetails:\n{json.dumps(l.details, indent=2)}"
        for i, l in enumerate(req.listings)
    )

    categories_text = json.dumps(
        [{"id": c["id"], "label": c["label"], "type": c["type"]} for c in req.categories],
        indent=2,
    )

    category_ids = [c["id"] for c in req.categories]
    origin_info = ""
    if req.trip_details:
        origin = req.trip_details.get("origin", "")
        travel_method = req.trip_details.get("travelMethod", "driving")
        if origin:
            origin_info = f"\nTrip origin: {origin} (travel method: {travel_method})"

    prompt = f"""You are comparing {n} Airbnb listings. Extract values for each comparison category from the listing data.{origin_info}

Categories (use these EXACT id strings as JSON keys — do not change them):
{categories_text}

Listings:
{listings_text}

Field mapping hints:
- "listing_name" or similar → use details.title
- "total_price" → use price_data.total (already a formatted string like "$450")
- "location" → use details coordinates/address or infer from listing data
- "bedrooms" → use details.sub_description or infer from title/description
- "host_rating" → use details.host_rating (already extracted as a float, e.g. 4.76)
- "guest_rating" or "rating" or "guest_satisfaction" → use details.rating.guest_satisfaction_overall
- "drive_time" or "drive_time_airport" or anything about drive/distance → use your geographic knowledge and the listing coordinates/address to estimate from the trip origin above
- "pet_friendly" or "pets_allowed" → check details.house_rules and details.available_amenities
- For boolean amenity categories (hot_tub, pool, etc.) → check details.available_amenities
- For any category not directly present, make your best inference from the available data

Rules:
- Use the exact "id" string from each category object as the JSON key.
- "price" type: use price_data.total exactly as given. If null, return null.
- "boolean" type: return true or false (JSON boolean).
- "number" type: return a plain number, no units.
- "string" type: return a concise string (e.g. "~2h 30min", "Mountain view").
- If truly unavailable after inference, return null.

Winners (0-based listing index, or -1 for tie/undetermined/subjective):
- Lower price = better, more beds/baths/capacity = better, true beats false, shorter drive = better, higher rating = better.
- Return -1 for descriptive or subjective categories where no listing is objectively better (e.g. location name, property type, view description, amenities list).

The exact category IDs to use as keys: {category_ids}

Return ONLY a valid JSON object (no markdown, no explanation):
{{
  "values": [ {{...}}, {{...}} ],
  "winners": {{...}}
}}"""

    try:
        response = generate_content_with_retry(client, "gemini-2.0-flash", prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
        if isinstance(parsed, str): parsed = json.loads(parsed)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Fill failed: {str(e)}")

@app.post("/summarize")
def summarize_reviews(req: SummarizeRequest):
    if not req.reviews:
        return {"summary": "No reviews available for this listing."}

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
    reviews_text = "\n".join(f"- {r}" for r in req.reviews)

    prompt = f"""You are an objective travel assistant. I will provide you with a list of raw guest reviews for a specific vacation rental{f' called "{req.listing_title}"' if req.listing_title else ''}.

Your task is to write a concise, 2 to 3 sentence summary representing "What people are saying".

Rules:
- Identify the 1-2 most praised features (e.g., cleanliness, specific amenities, location).
- Identify any consistent warnings or drawbacks (e.g., spotty Wi-Fi, steep stairs, street noise). If there are none, you may omit this.
- Do not use generic introductory filler phrases like "Overall, guests felt that..." or "Reviews indicate that...". Get straight to the facts.
- Keep the tone helpful, objective, and realistic.

Raw Reviews:
{reviews_text}

Return ONLY valid JSON:
{{"summary": "..."}}"""

    try:
        response = generate_content_with_retry(client, "gemini-2.0-flash", prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
        if isinstance(parsed, str): parsed = json.loads(parsed)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summarization failed: {str(e)}")

@app.post("/recommend")
def recommend(req: RecommendRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    comparison_rows = []
    if req.listings and req.listings[0].fill_values:
        all_keys = set()
        for l in req.listings:
            if l.fill_values:
                all_keys.update(l.fill_values.keys())
        for key in sorted(all_keys):
            row = {"category": key}
            for i, l in enumerate(req.listings):
                val = (l.fill_values or {}).get(key)
                row[f"listing_{i + 1}_{l.title}"] = val
            winner_idx = (req.winners or {}).get(key)
            if winner_idx is not None and winner_idx >= 0:
                row["winner"] = req.listings[winner_idx].title
            comparison_rows.append(row)

    comparison_table = json.dumps(comparison_rows, indent=2) if comparison_rows else "Not available"

    listings_text = "\n\n".join(
        f"Property {i + 1}: {l.title}\nKey data: {json.dumps(l.fill_values or {})}\nFull details summary: title={l.details.get('title')}, rating={l.details.get('rating', {}).get('guest_satisfaction_overall')}, host_rating={l.details.get('host_rating')}, is_guest_favorite={l.details.get('is_guest_favorite')}, amenities={l.details.get('available_amenities', [])[:10]}"
        for i, l in enumerate(req.listings)
    )

    prompt = f"""You are an expert luxury travel concierge. Analyze a user's trip requirements and recommend the best vacation rental from the options below.

Trip requirements:
{json.dumps(req.trip_details, indent=2)}

Comparison table (structured data extracted and ranked from each listing):
{comparison_table}

Property details:
{listings_text}

Use both the comparison table (which shows objectively ranked categories like ratings, price, amenities) AND the trip requirements (purpose, priorities, travel method, group size) to make your recommendation. Do not ignore low ratings or bad scores just because a property has a desired amenity.

Your output must follow this structure exactly:
- top_pick: The name of the single best property for their specific needs.
- why: A persuasive, 2-3 sentence explanation grounded in the user's criteria and the comparison data.
- trade_off: One sentence about one other property and why it could be the better choice if they prioritize a different specific factor.

Do not hallucinate amenities not present in the data. Keep the tone enthusiastic, professional, and honest.

Return ONLY valid JSON:
{{
  "top_pick": "Property Name",
  "why": "...",
  "trade_off": "..."
}}"""

    try:
        response = generate_content_with_retry(client, "gemini-2.0-flash", prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
        if isinstance(parsed, str): parsed = json.loads(parsed)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Recommendation failed: {str(e)}")

@app.post("/ask")
def ask(req: AskRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    listing_blocks = []
    for i, l in enumerate(req.listings):
        title = l.get("title", f"Listing {i + 1}")
        fill = l.get("fill_values", {})
        details = l.get("details", {})
        amenities = details.get("available_amenities", [])
        house_rules = details.get("house_rules", {})
        highlights = details.get("highlights", [])
        description = details.get("description", "")
        review_summary = req.review_summaries[i] if i < len(req.review_summaries) else None

        block = f"--- {title} ---"
        if fill: block += f"\nComparison data: {json.dumps(fill)}"
        if amenities: block += f"\nAmenities: {', '.join(amenities[:40])}"
        if house_rules: block += f"\nHouse rules: {json.dumps(house_rules)}"
        if highlights: block += f"\nHighlights: {', '.join(h.get('title', '') for h in highlights)}"
        if description: block += f"\nDescription: {description[:400]}"
        if review_summary: block += f"\nGuest reviews summary: {review_summary}"
        listing_blocks.append(block)

    listings_context = "\n\n".join(listing_blocks)

    winners_lines = []
    if req.winners and req.categories:
        cat_map = {c["id"]: c["label"] for c in req.categories}
        for cat_id, winner_idx in req.winners.items():
            if isinstance(winner_idx, int) and 0 <= winner_idx < len(req.listings):
                winner_name = req.listings[winner_idx].get("title", f"Listing {winner_idx + 1}")
                winners_lines.append(f"  {cat_map.get(cat_id, cat_id)}: {winner_name}")
    winners_context = ("Category winners:\n" + "\n".join(winners_lines)) if winners_lines else ""

    rec = req.recommendation
    rec_context = f"AI recommendation: {rec.get('top_pick')} is top. {rec.get('why')}" if rec else ""
    trip_context = f"Trip details: {json.dumps(req.trip_details)}" if req.trip_details else ""
    history_lines = "".join(f"{m.role}: {m.content}\n" for m in req.history)

    prompt = f"""You are a knowledgeable travel assistant. Answer the user's question using only the provided data.

{trip_context}
Listing data:
{listings_context}

{winners_context}
{rec_context}

Rules:
- Be specific — cite listing names and exact values.
- Keep answers concise (2–4 sentences).
- Respond in plain prose, no markdown or bullet points.

{f"Previous conversation:{chr(10)}{history_lines}" if history_lines else ""}User: {req.question}
Assistant:"""

    try:
        response = generate_content_with_retry(client, "gemini-2.0-flash", prompt)
        return {"answer": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ask failed: {str(e)}")