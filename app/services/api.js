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
    console.log('Creating note with data:', noteData);
  const formData = new FormData();
  
  // Asegúrate de que todos los campos sean strings
  formData.append('title', noteData.title);
  formData.append('details', noteData.details);
  
  // Para imágenes
  if (noteData.images) {
    noteData.images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg', // Asegurar type
        name: image.fileName || `image_${index}.jpg`,
      });
    });
  }
  
  // Para videos
  if (noteData.videos) {
    noteData.videos.forEach((video, index) => {
      formData.append('videos', {
        uri: video.uri,
        type: video.type || 'video/mp4', // Asegurar type
        name: video.fileName || `video_${index}.mp4`,
      });
    });
  }
  
  return api.post("/notes", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
},
    update: (id, noteData) => {
        const formData = new FormData();
        formData.append('title', noteData.title);
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