import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Ensure session cookies are sent/received correctly
  withCredentials: true,
});
