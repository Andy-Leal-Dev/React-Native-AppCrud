import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSyncQueue, loadNotesFromCache, syncNotesWithBackend, clearSyncQueue, loadNotesFromBackend, saveNotesToCache } from '../services/syncServices';

const SyncContext = createContext();
const SYNC_QUEUE_KEY = '@sync_queue';
export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync debe ser usado dentro de un SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [unsyncedNotes, setUnsyncedNotes] = useState([]);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    loadSyncStatus();
    
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const syncQueue = await getSyncQueue();
      setPendingSyncCount(syncQueue.length);
      
      const cachedNotes = await loadNotesFromCache();
      const unsynced = cachedNotes.filter(note => !note.synced);
      setUnsyncedNotes(unsynced);
      
      const lastSyncDate = await AsyncStorage.getItem('@last_sync');
      setLastSync(lastSyncDate ? new Date(lastSyncDate) : null);
      setSyncError(null);
      
    } catch (error) {
      console.error('Error loading sync status:', error);
      setSyncError('Error al cargar estado de sincronización');
    }
  };

  const performSync = async () => {
    if (isSyncing) return { success: true, message: 'Ya se está sincronizando' };
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // 1. Sincronizar la cola de operaciones pendientes
      const syncResults = await syncNotesWithBackend();
        if (syncResults.length === 0) {
      console.log('No operations to sync');
      await AsyncStorage.setItem('@last_sync', new Date().toISOString());
      setLastSync(new Date());
      return { success: true, message: 'No operations to sync' };
    }
      // 2. Verificar si hubo éxito en alguna operación
      const hasSuccess = syncResults.some(result => result.success);
      console.log('Sync results:', syncResults);
      console.log('Has at least one successful operation:', hasSuccess);
      if (hasSuccess) {

        // 3. Cargar notas actualizadas del backend
        const backendNotes = await loadNotesFromBackend();
        
        // 4. Cargar notas locales
        const localNotes = await loadNotesFromCache();
        
        // 5. Combinar manteniendo las notas locales no sincronizadas
        const mergedNotes = mergeNotesSafely(backendNotes, localNotes);
        
        // 6. Guardar notas combinadas
        await saveNotesToCache(mergedNotes);
        
        // 7. Limpiar solo las operaciones exitosas de la cola
        await clearSuccessfulOperations(syncResults);
        
        // 8. Actualizar última sincronización
        await AsyncStorage.setItem('@last_sync', new Date().toISOString());
        setLastSync(new Date());
        
        await loadSyncStatus();
        return { success: true, results: syncResults };
      } else {
        // Todas las operaciones fallaron, mantener cola intacta
        setSyncError('Error en todas las operaciones de sincronización');
        return { success: false, results: syncResults };
      }
      
    } catch (error) {
      console.error('Error during sync:', error);
      setSyncError('Error durante la sincronización');
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Función para combinar notas de forma segura
  const mergeNotesSafely = (backendNotes, localNotes) => {
    const backendMap = new Map();
    
    // Mapear notas del backend
    backendNotes.forEach(note => {
      const key = note.idCode || note.id;
      if (key) backendMap.set(key, { ...note, synced: true });
    });
    
    const mergedNotes = [...backendNotes.map(note => ({ ...note, synced: true }))];
    
    // Agregar notas locales que no están en el backend y no están sincronizadas
    localNotes.forEach(localNote => {
      const localKey = localNote.idCode || localNote.id;
      const existsInBackend = backendMap.has(localKey);
      
      if (!existsInBackend && !localNote.synced) {
        mergedNotes.push(localNote);
      }
    });
    
    return mergedNotes;
  };

  // Limpiar solo las operaciones exitosas
  const clearSuccessfulOperations = async (syncResults) => {
    try {
      const queue = await getSyncQueue();
      
      // Filtrar solo las operaciones que fallaron
      const failedOperations = queue.filter((_, index) => 
        !syncResults[index]?.success
      );
      
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedOperations));
      setPendingSyncCount(failedOperations.length);
      
    } catch (error) {
      console.error('Error clearing successful operations:', error);
    }
  };

  const value = {
    pendingSyncCount,
    isSyncing,
    lastSync,
    unsyncedNotes,
    syncError,
    syncStatus: isSyncing ? 'syncing' : pendingSyncCount > 0 ? 'pending' : 'synced',
    loadSyncStatus,
    performSync,
    clearSyncError: () => setSyncError(null)
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncContext;