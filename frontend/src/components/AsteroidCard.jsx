export default function AsteroidCard({ asteroid, onSimulate }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg mb-3 border border-gray-700">
      <h2 className="text-lg font-bold">{asteroid.name}</h2>
      <p>🪨 Diameter: {asteroid.diameter_km} km</p>
      <p>⚡ Velocity: {asteroid.velocity_kms} km/s</p>
      <p>📏 Distance: {asteroid.distance_km.toLocaleString()} km</p>
      <p>☢️ Hazard: {asteroid.hazardous ? "Yes" : "No"}</p>
      <button
        className="mt-3 bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg"
        onClick={() => onSimulate(asteroid)}
      >
        Simulate Impact
      </button>
    </div>
  );
}
