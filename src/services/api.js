import axios from 'axios';
import demoApi, { demoSessionKey } from './demoApi.js';

const baseURL = import.meta.env.VITE_API_URL?.trim();
export const isDemo = !baseURL;

const sessionKey = isDemo ? demoSessionKey : 'user';

export function readUser() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey));
  } catch {
    return null;
  }
}

export function writeUser(user) {
  localStorage.setItem(sessionKey, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(sessionKey);
}

export default baseURL ? axios.create({ baseURL, timeout: 8000 }) : demoApi;
