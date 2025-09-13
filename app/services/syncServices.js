// services/syncService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notesApi, notesAPI } from './api';

const NOTES_CACHE_KEY = '@notes_cache';
const SYNC_QUEUE_KEY = '@sync_queue';

// Cargar notas desde cache
export const loadNotesFromCache = async () => {
  try {
    const cachedNotes = await AsyncStorage.getItem(NOTES_CACHE_KEY);
    return cachedNotes ? JSON.parse(cachedNotes) : [];
  } catch (error) {
    console.error('Error loading notes from cache:', error);
    return [];
  }
};

// Guardar notas en cache
export const saveNotesToCache = async (notes) => {
  try {
    await AsyncStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to cache:', error);
  }
};

// Agregar nota a la cola de sincronización
export const addToSyncQueue = async (note, action = 'create') => {
  try {
    const queue = await getSyncQueue();
    queue.push({ note, action, timestamp: Date.now() });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

// Obtener cola de sincronización
export const getSyncQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

// Limpiar cola de sincronización
export const clearSyncQueue = async () => {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
};

// Sincronizar notas con el backend
// En syncServices.js, modificar syncNotesWithBackend
export const syncNotesWithBackend = async () => {
  try {
    const queue = await getSyncQueue();
    const results = [];
    
    for (const item of queue) {
      try {
        // Preparar FormData para enviar archivos
        const formData = new FormData();
        
        formData.append('title', item.note.title.toString());
        formData.append('details', item.note.details?.toString() || '');
        
        // Agregar imágenes si existen
        if (item.note.images && item.note.images.length > 0) {
          item.note.images.forEach((image, index) => {
            formData.append('images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.fileName || `image_${index}.jpg`,
            });
          });
        }
        
        // Agregar videos si existen
        if (item.note.videos && item.note.videos.length > 0) {
          item.note.videos.forEach((video, index) => {
            formData.append('videos', {
              uri: video.uri,
              type: video.type || 'video/mp4',
              name: video.fileName || `video_${index}.mp4`,
            });
          });
        }
        
        let result;
        
        switch (item.action) {
          case 'create':
            result = await notesApi.create(formData);
            break;
          case 'update':
            result = await notesApi.update(item.note.id, formData);
            break;
          case 'delete':
            result = await notesApi.delete(item.note.id);
            break;
        }
        
        results.push({ success: true, result });
      } catch (error) {
        console.log('Sync error for note:', item.note.id, error.response?.data || error.message);
        results.push({ success: false, error });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in sync process:', error);
    throw error;
  }
};
// Cargar todas las notas del backend
export const loadNotesFromBackend = async () => {
  try {
    const response = await notesApi.getAll();
    return response.data;
  } catch (error) {
    console.error('Error loading notes from backend:', error);
    throw error;
  }
};

// Sincronizar inicialmente (al iniciar la app)

// En syncServices.js, modificar initialSync
export const initialSync = async () => {
  try {
    // Cargar notas del backend
    const backendNotes = await loadNotesFromBackend();
    
    // Cargar notas locales
    const localNotes = await loadNotesFromCache();
    
    // Filtrar notas locales que no están sincronizadas
    const unsyncedLocalNotes = localNotes.filter(note => !note.synced);
    
    // Si no hay notas no sincronizadas, usar las del backend
    if (unsyncedLocalNotes.length === 0) {
      await saveNotesToCache(backendNotes);
      return backendNotes;
    }
    
    // Si hay notas no sincronizadas, mantenerlas junto con las del backend
    const backendNoteIds = new Set(backendNotes.map(note => note.id));
    const notesToKeep = unsyncedLocalNotes.filter(note => !backendNoteIds.has(note.id));
    
    const mergedNotes = [...backendNotes, ...notesToKeep];
    await saveNotesToCache(mergedNotes);
    
    return mergedNotes;
    
  } catch (error) {
    console.error('Initial sync failed, using cached notes:', error);
    return await loadNotesFromCache();
  }
};

// En syncServices.js, agregar esta función
const mergeNotes = (backendNotes, localNotes) => {
  const backendNoteMap = new Map();
  backendNotes.forEach(note => backendNoteMap.set(note.id, note));
  
  const mergedNotes = [...backendNotes];
  
  // Agregar solo notas locales que no están en el backend o no están sincronizadas
  localNotes.forEach(localNote => {
    const backendNote = backendNoteMap.get(localNote.id);
    
    if (!backendNote) {
      // Nota local que no existe en backend
      mergedNotes.push(localNote);
    } else if (!localNote.synced) {
      // Nota local no sincronizada, reemplazar la del backend
      const index = mergedNotes.findIndex(n => n.id === localNote.id);
      if (index !== -1) {
        mergedNotes[index] = localNote;
      }
    }
  });
  
  return mergedNotes;
};