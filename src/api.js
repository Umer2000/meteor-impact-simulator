import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

export const getNasaAsteroids = async () => {
  const res = await axios.get(`${API_BASE}/nasa-asteroids`);
  return res.data;
};

export const simulateMeteor = async (meteor) => {
  const res = await axios.post(`${API_BASE}/simulate`, meteor);
  return res.data;
};
