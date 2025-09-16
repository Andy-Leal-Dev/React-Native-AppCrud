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
    
    if (queue.length === 0 || !queue || queue.isEmpty) {
      return [];
    } else {
      // Bucle para procesar cada elemento de la cola de sincronización
      for (const item of queue) {
        try {
          console.log('Syncing note:', item.note.idCode, 'Action:', item.action);

                  
        if (item.action === 'update' && item.note.deletedMediaIds && item.note.deletedMediaIds.length > 0) {
          // Primero eliminar los medios marcados para eliminación
          for (const mediaId of item.note.deletedMediaIds) {
            try {
              await notesApi.deleteMedia(mediaId);
              console.log('Media deleted successfully:', mediaId);
            } catch (error) {
              console.error('Error deleting media:', mediaId, error);
              // Continuar con otros medios aunque falle uno
            }
          }
        }

          const formData = new FormData();
          
          formData.append('title', item.note.title);
          formData.append('details', item.note.details || '');
          
          if (item.note.idCode) {
            formData.append('idCode', item.note.idCode);
          }

           if (item.action === 'update' && item.note.deletedMediaIds && item.note.deletedMediaIds.length > 0) {
          formData.append('deletedMediaIds', item.note.deletedMediaIds.join(','));
        }
          
          // Agregar imágenes y videos
          if (item.note.images && item.note.images.length > 0) {
            item.note.images.forEach((image, index) => {
              if (image.uri && image.type) {
                formData.append('images', {
                  uri: image.uri,
                  type: image.type || 'image/jpeg',
                  name: image.fileName || `image_${index}.jpg`,
                });
              }
            });
          }
          
          if (item.note.videos && item.note.videos.length > 0) {
            item.note.videos.forEach((video, index) => {
              if (video.uri && video.type) {
                formData.append('videos', {
                  uri: video.uri,
                  type: video.type || 'video/mp4',
                  name: video.fileName || `video_${index}.mp4`,
                });
              }
            });
          }
          
          let response;
          let backendId;
          
          switch (item.action) {
            case 'create':
              response = await notesApi.create(formData);
              console.log('Create response status:', response.status);
              
              // Manejar el status 302 como éxito
              if (response.status === 302) {
                console.log('Note already exists on backend - treating as success');
                results.push({ 
                  success: true, 
                  status: 302,
                  message: 'Note already registered',
                  data: response.data,
                  alreadyExists: true
                });
                break;
              }
              
              // Manejar otros status exitosos
              if (response.status >= 200 && response.status < 300) {
                console.log('Create successful:', response.data);
                backendId = response.data.id;
                if (item.note.idCode && backendId) {
                  await saveIdCodeMap(item.note.idCode, backendId);
                }
                results.push({ success: true, data: response.data });
              } else {
                // Manejar otros status no exitosos
                results.push({ 
                  success: false, 
                  error: `Unexpected status: ${response.status}`,
                  data: response.data 
                });
              }
              break;
              
            case 'update':
              const updateId = idCodeMap[item.note.idCode] || item.note.id;
              if (updateId) {
                console.log('Updating note with ID:', updateId);
                response = await notesApi.update(updateId, formData);
                
                if (response.status === 302 || (response.status >= 200 && response.status < 300)) {
                  console.log('Update successful for note:', updateId);
                  results.push({ 
                    success: true, 
                    data: response.data,
                    noteId: updateId
                  });
                } else {
                  console.log('Update failed for note:', updateId, 'Status:', response.status);
                  results.push({ 
                    success: false, 
                    error: `Update failed with status: ${response.status}`,
                    data: response.data,
                    noteId: updateId
                  });
                }
              } else {
                console.log('No valid ID found for update operation');
                results.push({ 
                  success: false, 
                  error: 'No valid ID found for update operation',
                  note: item.note
                });
              }
              break;
              
            case 'delete':
              const deleteId = idCodeMap[item.note.idCode] || item.note.id;
              if (deleteId) {
                console.log('Deleting note with ID:', deleteId);
                response = await notesApi.delete(deleteId);
                
                if (response.status === 302 || (response.status >= 200 && response.status < 300)) {
                  console.log('Delete successful for note:', deleteId);
                  // Eliminar del mapeo después de borrar
                  if (item.note.idCode) {
                    const newMap = { ...idCodeMap };
                    delete newMap[item.note.idCode];
                    await AsyncStorage.setItem(ID_CODE_MAP_KEY, JSON.stringify(newMap));
                  }
                  results.push({ 
                    success: true, 
                    data: response.data,
                    noteId: deleteId
                  });
                } else {
                  console.log('Delete failed for note:', deleteId, 'Status:', response.status);
                  results.push({ 
                    success: false, 
                    error: `Delete failed with status: ${response.status}`,
                    data: response.data,
                    noteId: deleteId
                  });
                }
              } else {
                console.log('No valid ID found for delete operation');
                results.push({ 
                  success: false, 
                  error: 'No valid ID found for delete operation',
                  note: item.note
                });
              }
              break;
          }
          
        } catch (error) {
          // Este catch solo debería capturar errores de red o excepciones, no errores HTTP
          const noteId = item.note.idCode || item.note.id || 'unknown';
          console.log('Network error for note:', noteId, error.message);
          
          results.push({ 
            success: false, 
            error: 'Network error', 
            message: error.message,
            noteId: noteId
          });
        }
      }
      
      console.log('Sync results:', results);
      return results;
    }
    
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

// Nueva función para procesar múltiples actualizaciones
export const processMultipleUpdates = async (notesToUpdate) => {
  try {
    const results = [];
    
    // Procesar cada nota en un bucle
    for (const noteData of notesToUpdate) {
      const { noteId, updatedNote } = noteData;
      
      try {
        // Agregar a la cola de sincronización
        await addToSyncQueue(updatedNote, 'update');
        
        // Realizar la sincronización
        const syncResults = await syncNotesWithBackend();
        
        // Filtrar resultados para esta nota específica
        const noteResults = syncResults.filter(result => 
          result.noteId === noteId || 
          (result.data && result.data.id === noteId)
        );
        
        results.push({
          noteId,
          success: noteResults.some(r => r.success),
          results: noteResults
        });
        
      } catch (error) {
        console.error(`Error processing update for note ${noteId}:`, error);
        results.push({
          noteId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in processMultipleUpdates:', error);
    throw error;
  }
};