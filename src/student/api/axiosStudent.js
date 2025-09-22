// lightweight axios instance for student APIs
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
console.log("Axios (student) baseURL →", baseURL);

const api = axios.create({ baseURL });

export default api;
