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
export const syncNotesWithBackend = async () => {
  try {
    const queue = await getSyncQueue();
    const results = [];
    
    for (const item of queue) {
      try {
        let result;
        
        switch (item.action) {
          case 'create':
            result = await notesApi.create(item.note);
            break;
          case 'update':
            result = await notesApi.update(item.note.id, item.note);
            break;
          case 'delete':
            result = await notesApi.delete(item.note.id);
            break;
          default:
            console.warn('Unknown action in sync queue:', item.action);
            continue;
        }
        
        results.push({ success: true, result });
      } catch (error) {
        console.log(`Error syncing note ${item.note.id}:`, error['error'] || error);
        results.push({ success: false, error });
        // Si falla, mantenemos el item en la cola para reintentar luego
        continue;
      }
    }
    
    // Si todas las operaciones fueron exitosas, limpiamos la cola
    if (results.every(r => r.success)) {
      await clearSyncQueue();
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

export const initialSync = async () => {
  try {
    // Primero intentamos cargar desde el backend
    const backendNotes = await loadNotesFromBackend();
    const localNotes = await loadNotesFromCache();
    
    // Fusionar notas: priorizar backend pero mantener locales no sincronizadas
    const mergedNotes = mergeNotes(backendNotes, localNotes);
    
    await saveNotesToCache(mergedNotes);
    return mergedNotes;
  } catch (error) {

    console.error('Initial sync failed, using cached notes:', error);
    // Si falla, usamos las notas en cache
    return await loadNotesFromCache();
  }
};

// Función para fusionar notas
const mergeNotes = (backendNotes, localNotes) => {
  const backendNoteIds = new Set(backendNotes.map(note => note.id));
  
  // Agregar notas locales que no están en el backend
  const localNotesToKeep = localNotes.filter(note => 
    !backendNoteIds.has(note.id) || !note.synced
  );
  
  // Combinar, priorizando backend
  return [...backendNotes, ...localNotesToKeep];
};