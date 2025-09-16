import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "https://backend-noteeasy-appcrud.onrender.com/api"; // Replace with your actual API endpoint

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);
api.defaults.validateStatus = function (status) {
  // Aceptar todos los status codes incluyendo 302
  return status >= 200 && status < 500; // Esto incluye 200-499
};

export const authApi ={
    login: (email, password) => api.post("/auth/login", { email, password }),
    register: (userData) => api.post("/auth/register", { ...userData }),
    getUserData: () => api.get("/user"),
}

export const notesApi = {
    getAll: () => api.get("/notes"),
    getById: (id) => api.get(`/notes/${id}`),
    // En tu función create de notesApi
create: (noteData) => {
   
  return api.post("/notes", noteData , {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
    update: (id, noteData) => {
        const formData = new FormData();
        formData.append('title', noteData.title);
        formData.append('idCode', noteData.details);
        if (noteData.details) {
            formData.append('details', noteData.details);
        }
        if (noteData.images) {
            noteData.images.forEach((image, index) => {
                formData.append('images', {
                    uri: image.uri,
                    type: image.type,
                    name: image.fileName || `image_${index}.jpg`,
                });
            });
        }
        if (noteData.videos) {
            noteData.videos.forEach((video, index) => {
                formData.append('videos', {
                    uri: video.uri,
                    type: video.type,
                    name: video.fileName || `video_${index}.mp4`,
                });
            });
        }
        return api.put(`/notes/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`/notes/${id}`),
    deleteMedia: (mediaId) => api.delete(`/notes/media/${mediaId}`),
}

export default api;