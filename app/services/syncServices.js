// services/syncServices.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notesApi } from './api';

const NOTES_CACHE_KEY = '@notes_cache';
const SYNC_QUEUE_KEY = '@sync_queue';
const ID_CODE_MAP_KEY = '@id_code_map';

// Función para generar ID único
export const generateUniqueId = () => {
  return Math.floor(Math.random() * 1e12);
};

// Guardar mapeo de ID local a ID del backend
export const saveIdCodeMap = async (localId, backendId) => {
  try {
    const map = await getIdCodeMap();
    map[localId] = backendId;
    await AsyncStorage.setItem(ID_CODE_MAP_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('Error saving ID code map:', error);
  }
};

// Obtener mapeo de ID local a ID del backend
export const getIdCodeMap = async () => {
  try {
    const map = await AsyncStorage.getItem(ID_CODE_MAP_KEY);
    return map ? JSON.parse(map) : {};
  } catch (error) {
    console.error('Error getting ID code map:', error);
    return {};
  }
};

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
    queue.push({ 
      note: {
        ...note,
        // Incluir idCode para referencias cruzadas
        idCode: note.idCode || note.id
      }, 
      action, 
      timestamp: Date.now() 
    });
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
export const syncNotesWithBackend = async () => {
  try {
    const queue = await getSyncQueue();
    const idCodeMap = await getIdCodeMap();
    const results = [];
    
    for (const item of queue) {
      try {
        console.log('Syncing note:', item.note, 'Action:', item.action);
        const formData = new FormData();
        
        formData.append('title', item.note.title);
        formData.append('details', item.note.details );
        
        // Incluir idCode si existe
        if (item.note.idCode) {
          formData.append('idCode', item.note.idCode);
        }
        
        // Agregar imágenes si existen
        if (item.note.images && item.note.images.length > 0) {
          item.note.images.forEach((image, index) => {
            // Verificar que el archivo existe antes de agregarlo
            if (image.uri && image.type) {
              formData.append('images', {
                uri: image.uri,
                type: image.type || 'image/jpeg',
                name: image.fileName || `image_${index}.jpg`,
              });
            }
          });
        }
        
        // Agregar videos si existen
        if (item.note.videos && item.note.videos.length > 0) {
          item.note.videos.forEach((video, index) => {
            // Verificar que el archivo existe antes de agregarlo
            if (video.uri && video.type) {
              formData.append('videos', {
                uri: video.uri,
                type: video.type || 'video/mp4',
                name: video.fileName || `video_${index}.mp4`,
              });
            }
          });
        }
        
        let result;
        let backendId;
        
        switch (item.action) {
          case 'create':
            result = await notesApi.create(formData);
            console,log('Create result:', result);
            backendId = result.data.id;
            // Guardar mapeo de ID local a ID del backend
            if (item.note.idCode && backendId) {
              await saveIdCodeMap(item.note.idCode, backendId);
            }
            break;
            
          case 'update':
            // Usar el ID del backend si existe el mapeo
            const updateId = idCodeMap[item.note.idCode] || item.note.id;
            if (updateId) {
              result = await notesApi.update(updateId, formData);
            }
            break;
            
          case 'delete':
            // Usar el ID del backend si existe el mapeo
            const deleteId = idCodeMap[item.note.idCode] || item.note.id;
            if (deleteId) {
              result = await notesApi.delete(deleteId);
              // Eliminar del mapeo después de borrar
              if (item.note.idCode) {
                const newMap = { ...idCodeMap };
                delete newMap[item.note.idCode];
                await AsyncStorage.setItem(ID_CODE_MAP_KEY, JSON.stringify(newMap));
              }
            }
            break;
        }
        console.log('Sync successful for note:', item.note, 'Result:', result?.data);
        results.push({ success: true, result });
      } catch (error) {
        
        const noteId = item.note && (item.note.id !== undefined ? item.note.id : (item.note.idCode !== undefined ? item.note.idCode : 'unknown'));
        console.log('Sync error for note:', noteId, error.response?.data || error.message);
 
        results.push({ success: false, error });
      }
    }
    console.log('Sync results:', results);
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
export const initialSync = async () => {
  try {
    // Cargar notas del backend
    const backendNotes = await loadNotesFromBackend();
    
    // Cargar notas locales
    const localNotes = await loadNotesFromCache();
    const idCodeMap = await getIdCodeMap();
    
    // Combinar notas
    const mergedNotes = mergeNotes(backendNotes, localNotes, idCodeMap);
    
    await saveNotesToCache(mergedNotes);
    return mergedNotes;
    
  } catch (error) {
    console.error('Initial sync failed, using cached notes:', error);
    return await loadNotesFromCache();
  }
};

// Función para combinar notas
const mergeNotes = (backendNotes, localNotes, idCodeMap) => {
  const backendNoteMap = new Map();
  
  // Mapear notas del backend por idCode si existe, o por id
  backendNotes.forEach(note => {
    const key = note.idCode || note.id;
    backendNoteMap.set(key, note);
  });
  
  const mergedNotes = [...backendNotes];
  
  // Agregar notas locales que no están en el backend
  localNotes.forEach(localNote => {
    const localKey = localNote.idCode || localNote.id;
    const backendNote = backendNoteMap.get(localKey);
    
    if (!backendNote && !localNote.synced) {
      // Nota local que no existe en backend y no está sincronizada
      mergedNotes.push(localNote);
    }
  });
  
  return mergedNotes;
};