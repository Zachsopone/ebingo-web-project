import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data.token;
};

export const getProtectedData = async (token) => {
  const response = await axios.get(`${API_URL}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
