from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
import math
import requests
from datetime import datetime, timedelta

# ==========================================================
# 1️⃣ Database setup
# ==========================================================
DATABASE_URL = "sqlite:///meteor.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Meteor(Base):
    __tablename__ = "meteors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    radius = Column(Float)

Base.metadata.create_all(bind=engine)

# ==========================================================
# 2️⃣ Pydantic models
# ==========================================================
class MeteorCreate(BaseModel):
    name: str
    lat: float
    lng: float
    radius: float = 50  # default value

class MeteorSimInput(BaseModel):
    name: str
    lat: float
    lng: float
    radius: float
    velocity: float

class MeteorSimOutput(BaseModel):
    name: str
    energy_tnt: float
    impact_radius_km: float
    severity: str

# ==========================================================
# 3️⃣ FastAPI app setup
# ==========================================================
app = FastAPI(title="🌍 Meteor Madness Backend")

# --- Enable CORS for frontend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins (you can restrict later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================================
# 4️⃣ Root route (for quick check)
# ==========================================================
@app.get("/")
def root():
    return {"message": "Meteor Madness API is live 🚀"}

# ==========================================================
# 5️⃣ CRUD Endpoints
# ==========================================================
@app.get("/meteors")
def get_meteors(db: Session = Depends(get_db)):
    return db.query(Meteor).all()

@app.post("/meteors")
def add_meteor(meteor: MeteorCreate, db: Session = Depends(get_db)):
    db_meteor = Meteor(
        name=meteor.name,
        lat=meteor.lat,
        lng=meteor.lng,
        radius=meteor.radius
    )
    db.add(db_meteor)
    db.commit()
    db.refresh(db_meteor)
    return db_meteor

@app.delete("/meteors")
def clear_meteors(db: Session = Depends(get_db)):
    db.query(Meteor).delete()
    db.commit()
    return {"message": "All meteors cleared"}

# ==========================================================
# 6️⃣ Simulation logic
# ==========================================================
def simulate_impact(radius_km: float, velocity_kms: float):
    density = 3000  # kg/m³
    radius_m = radius_km * 1000
    volume = (4/3) * math.pi * radius_m**3
    mass = density * volume
    velocity_ms = velocity_kms * 1000
    kinetic_energy_j = 0.5 * mass * velocity_ms**2
    energy_tnt = kinetic_energy_j / 4.184e15  # convert to megatons TNT

    # Impact radius approximation
    impact_radius_km = 0.01 * (energy_tnt ** 0.33) * 1000

    # Severity classification
    if energy_tnt < 1:
        severity = "Low"
    elif energy_tnt < 10:
        severity = "Moderate"
    elif energy_tnt < 100:
        severity = "High"
    else:
        severity = "Catastrophic"

    return energy_tnt, impact_radius_km, severity

@app.post("/simulate", response_model=MeteorSimOutput)
def simulate_meteor(input: MeteorSimInput):
    energy_tnt, impact_radius_km, severity = simulate_impact(input.radius, input.velocity)
    return MeteorSimOutput(
        name=input.name,
        energy_tnt=round(energy_tnt, 2),
        impact_radius_km=round(impact_radius_km, 2),
        severity=severity
    )

# ==========================================================
# 7️⃣ NASA Near-Earth Objects API Integration
# ==========================================================
NASA_API_URL = "https://api.nasa.gov/neo/rest/v1/feed"
NASA_API_KEY = "Y1pUJMoEZBNhQeeZ0ySUlifP7P4fdsxv3QImfO75"  # Replace with your key from https://api.nasa.gov/

@app.get("/nasa-asteroids")
def get_nasa_asteroids():
    today = datetime.utcnow().date()
    end_date = today + timedelta(days=3)
    params = {
        "start_date": today,
        "end_date": end_date,
        "api_key": NASA_API_KEY
    }

    try:
        response = requests.get(NASA_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        return {"error": f"Failed to fetch NASA data: {e}"}

    asteroids = []
    for date, objs in data.get("near_earth_objects", {}).items():
        for obj in objs:
            try:
                asteroids.append({
                    "name": obj["name"],
                    "diameter_km": round(obj["estimated_diameter"]["kilometers"]["estimated_diameter_max"], 3),
                    "velocity_kms": round(float(obj["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"]), 2),
                    "distance_km": round(float(obj["close_approach_data"][0]["miss_distance"]["kilometers"]), 2),
                    "hazardous": obj["is_potentially_hazardous_asteroid"]
                })
            except Exception:
                continue
    return asteroids

# ==========================================================
# 8️⃣ USGS Terrain Elevation API Integration
# ==========================================================
USGS_ELEVATION_API = "https://nationalmap.gov/epqs/pqs.php"

@app.get("/terrain")
def get_terrain(lat: float, lng: float):
    params = {
        "x": lng,
        "y": lat,
        "units": "Meters",
        "output": "json"
    }

    try:
        response = requests.get(USGS_ELEVATION_API, params=params)
        response.raise_for_status()
        data = response.json()
        elevation = data["USGS_Elevation_Point_Query_Service"]["Elevation_Query"]["Elevation"]
        return {
            "latitude": lat,
            "longitude": lng,
            "elevation_meters": elevation
        }
    except Exception as e:
        return {"error": f"Failed to fetch terrain data: {e}"}
