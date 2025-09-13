import { useRef, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import Constants from 'expo-constants';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import note from "../../jsons/notes.json";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetTextInput,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddNoteBottomSheet from '../../components/addNoteBottomSheet';
import NoteDetailBottomSheet from '../../components/noteDetailBottomSheet';
import {loadNotesFromBackend, loadNotesFromCache, saveNotesToCache, addToSyncQueue, syncNotesWithBackend,initialSync } from '../../services/syncServices';
import { authApi } from "../../services/api";

// Directorio para guardar archivos
const NOTES_DIR = FileSystem.documentDirectory + 'notes_media/';
const NOTES_CACHE_KEY = '@notes_cache';

// Función para calcular tiempo relativo
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seg`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

// Función para asegurar que el directorio existe
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
  }
}

// Función para copiar archivo al directorio de notas
async function copyFileToNotesDir(fileUri, fileName) {
  await ensureDirExists();
  const newPath = NOTES_DIR + fileName;
  await FileSystem.copyAsync({ from: fileUri, to: newPath });
  return newPath;
}



export default function HomeScreen() {
  const addNoteSheetRef = useRef(null);
  const detailSheetRef = useRef(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const [searchQuery, setSearchQuery] = useState(''); // Estado para la búsqueda

  // Estado para notas
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]); // Notas filtradas

  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState(null);

  // Cargar notas al iniciar
   useEffect(() => {
    const initialApp = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
          console.log('User data loaded:', JSON.parse(userData));
          const notes = await initialSync();
          setNotes(notes);
          setFilteredNotes(notes);
          await syncPendingNotes();
        }
        const cachedNotes = await loadNotesFromCache();
        setNotes(cachedNotes);
        setFilteredNotes(cachedNotes);
        
      } catch (error) {
        console.error('Error during initial app load:', error);
        const cachedNotes = await loadNotesFromCache();
        setNotes(cachedNotes);
        setFilteredNotes(cachedNotes);
      }
    };
    initialApp();
  }, []);

const syncPendingNotes = async () => {
  try {
    setIsSyncing(true);
    
    // Primero sincronizar la cola
    await syncNotesWithBackend();
    
    // Luego cargar todas las notas del backend y fusionar
    const backendNotes = await loadNotesFromBackend();
    const localNotes = await loadNotesFromCache();
    
    const mergedNotes = [...backendNotes];
    
    // Agregar notas locales que no están sincronizadas
    localNotes.forEach(localNote => {
      if (!localNote.synced || !backendNotes.some(backendNote => backendNote.id === localNote.id)) {
        mergedNotes.push(localNote);
      }
    });
    
    await saveNotesToCache(mergedNotes);
    setNotes(mergedNotes);
    setFilteredNotes(mergedNotes);

  } catch (error) {
    console.error('Error syncing notes:', error);
  } finally {
    setIsSyncing(false);
  }
}

  // Agregar botón de sincronización manual

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.details.toLowerCase().includes(query)
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  // Estados para inputs de nueva nota
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  // callbacks
  const handlePresentAddNoteSheet = useCallback(() => {
    addNoteSheetRef.current?.present();
  }, []);
  const handlePresentDetailSheet = useCallback((note) => {
    setSelectedNote(note);
    detailSheetRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);
  const handleAddNote = async () => {
     if (!newTitle.trim()) return;

  // Limpiar datos
  const cleanNote = {
    title: newTitle.trim(),
    details: newDetails.trim() || '',
    images: images.map(img => ({
      uri: img.uri,
      fileName: img.fileName,
      fileSize: img.fileSize,
      type: 'image/jpeg' // Asegurar type
    })),
    videos: videos.map(vid => ({
      uri: vid.uri,
      fileName: vid.fileName,
      fileSize: vid.fileSize,
      type: 'video/mp4' // Asegurar type
    }))
  };


    if (!user) {
      // Solo local
      const newNote = {
        id: Date.now().toString(),
        title: newTitle,
        date: new Date().toLocaleDateString('es-ES'),
        timestamp: Date.now(),
        details: newDetails,
        images: images,
        videos: videos,
        synced: false
      };

      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      await saveNotesToCache(updatedNotes);

      await addToSyncQueue(newNote, 'create');
      setNewTitle('');
      setNewDetails('');
      setImages([]);
      setVideos([]);
      addNoteSheetRef.current?.close();
      syncPendingNotes();
    } else {
      // Usuario logueado: copiar archivos y guardar
      const copiedImages = [];
      for (const img of images) {
        try {
          const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const newPath = await copyFileToNotesDir(img.uri, fileName);
          copiedImages.push({
            uri: newPath,
            fileName: fileName,
            fileSize: img.fileSize || 0,
            addedAt: new Date(),
          });
        } catch (error) {
          console.error('Error copying image:', error);
        }
      }

      const copiedVideos = [];
      for (const vid of videos) {
        try {
          const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
          const newPath = await copyFileToNotesDir(vid.uri, fileName);
          copiedVideos.push({
            uri: newPath,
            fileName: fileName,
            fileSize: vid.fileSize || 0,
            addedAt: new Date(),
          });
        } catch (error) {
          console.error('Error copying video:', error);
        }
      }

      const newNote = {
        id: Date.now().toString(),
        title: newTitle,
        date: new Date().toLocaleDateString('es-ES'),
        timestamp: Date.now(),
        details: newDetails,
        images: copiedImages,
        videos: copiedVideos,
      };

      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      await saveNotesToCache(updatedNotes);

      setNewTitle('');
      setNewDetails('');
      setImages([]);
      setVideos([]);
      addNoteSheetRef.current?.close();
    }
  };

  // Función para eliminar nota
  const handleDeleteNote = async (noteId) => {
    const noteToDelete = notes.find(note => note.id === noteId);

    if (!user) {
      // Solo local
      if (noteToDelete.synced) {
        await addToSyncQueue(noteToDelete, 'delete');
      }
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      await saveNotesToCache(updatedNotes);
      detailSheetRef.current?.close();
      syncPendingNotes();
    } else {
      // Usuario logueado: eliminar archivos asociados
      if (noteToDelete.images) {
        for (const img of noteToDelete.images) {
          await deleteFile(img.uri);
        }
      }
      if (noteToDelete.videos) {
        for (const vid of noteToDelete.videos) {
          await deleteFile(vid.uri);
        }
      }
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      setFilteredNotes(updatedNotes);
      await saveNotesToCache(updatedNotes);
      detailSheetRef.current?.close();
    }
  };

  // Eliminar archivo
  const deleteFile = async (fileUri) => {
    try {
      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };


  // Selección de imágenes
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        addedAt: new Date(),
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize || 0,
      }));

      setImages(prev => [...prev, ...newImages]);
    }
  };

  // Selección de videos
  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newVideos = result.assets.map(asset => ({
        uri: asset.uri,
        addedAt: new Date(),
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize || 0,
      }));
      setVideos(prev => [...prev, ...newVideos]);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
           <ScrollView>
            <View style={styles.header}>
              <View style={{flexDirection:'row', alignItems:'center',
              justifyContent:'space-between', gap:8}}>
                <Text style={styles.textHeader}>Hola! {user ? user.firstName : 'usuario'} </Text>
                <TouchableOpacity
      style={[styles.syncButton, styles.syncButton, isSyncing && styles.syncingButton]}
      onPress={syncPendingNotes}
      disabled={isSyncing}
    >
      <Ionicons
        name={isSyncing ? "refresh-circle" : "cloud-upload"}
        size={20}
        color="white"
      />
    </TouchableOpacity>
              </View>
              <View style={styles.ViewSearch}>
                <TextInput
                  placeholder="Buscar notas por título o contenido"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
                <TouchableOpacity>
                  <Ionicons name="search-sharp" size={24} color="black" />
                </TouchableOpacity>
              </View>
              {searchQuery.trim() !== '' && (
                <Text style={styles.searchResultsText}>
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'nota encontrada' : 'notas encontradas'}
                </Text>
              )}
            </View>

            {filteredNotes.length === 0 && searchQuery.trim() !== '' ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={50} color="#ccc" />
                <Text style={styles.noResultsText}>No se encontraron notas</Text>
                <Text style={styles.noResultsSubText}>
                  Intenta con diferentes palabras clave o crea una nueva nota
                </Text>
              </View>
            ) : (
              <View key={'0'} style={styles.containerCardNote}>
                {filteredNotes.map((item, idx) => (
                  <Pressable
                    key={item.id || idx}
                    style={styles.cardNote}
                    onPress={() => handlePresentDetailSheet(item)}
                  >
                    <View style={styles.viewCardNote}>
                      {/* Resaltar texto coincidente en el título */}
                      {searchQuery.trim() !== '' ? (
                        <Text style={styles.textTitleNote}>
                          {highlightText(item.title, searchQuery)}
                        </Text>
                      ) : (
                        <Text style={styles.textTitleNote}>{item.title}</Text>
                      )}

                      <Text style={styles.textCardNote}>{item.date}</Text>

                      {/* Resaltar texto coincidente en los detalles */}
                      {searchQuery.trim() !== '' ? (
                        <Text
                          style={styles.textCardNote}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {highlightText(item.details, searchQuery)}
                        </Text>
                      ) : (
                        <Text
                          style={styles.textCardNote}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.details}
                        </Text>
                      )}

                      <Text style={styles.textDetails}>Presiona para ver más detalles</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={{height:30}}/>
          </ScrollView>
          <TouchableOpacity style={styles.floatingButton} onPress={handlePresentAddNoteSheet}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

           <AddNoteBottomSheet
            ref={addNoteSheetRef}
            onChange={handleSheetChanges}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newDetails={newDetails}
            setNewDetails={setNewDetails}
            images={images}
            setImages={setImages}
            videos={videos}
            setVideos={setVideos}
            pickImage={pickImage}
            pickVideo={pickVideo}
            handleAddNote={handleAddNote}
            timeAgo={timeAgo}
          />

          <NoteDetailBottomSheet
            ref={detailSheetRef}
            onChange={handleSheetChanges}
            selectedNote={selectedNote}
            handleDeleteNote={handleDeleteNote}
            timeAgo={timeAgo}
          />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
const highlightText = (text, query) => {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ?
      <Text key={index} style={{ backgroundColor: '#FFEB3B', fontWeight: 'bold' }}>{part}</Text> :
      part
  );
};

const COLORS = {
  primary: "#2196F3",
  accent: "#449DD1",
  background: "#f7f9fc",
  card: "#fff",
  border: "#e3e3e3",
  text: "#222",
  muted: "#888",
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    paddingHorizontal: 10,
    height: '100%',
    backgroundColor: COLORS.background,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  searchResultsText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  textHeader: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  ViewSearch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    height: 50,
  },
  inputSearch: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  containerCardNote: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  cardNote: {
    width: "96%",
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  viewCardNote: {
    padding: 18,
  },
  textTitleNote: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textCardNote: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 15,
  },
  textDetails: {
    marginTop: 12,
    color: COLORS.accent,
    fontWeight: '500',
    fontSize: 14,
  },
  floatingButton: {
    backgroundColor: COLORS.primary,
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 30,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  contentContainerNote: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  creatNote: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  creatNoteOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  inputCreateNote: {
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  inputDetailsNote: {
    width: '100%',
    minHeight: 120,
    maxHeight: 180,
    textAlignVertical: 'top',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  image: {
    width: '20%',
    height: '80%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    resizeMode: 'stretch',
  },
  videoThumb: {
 width: '20%',
    height: '80%',
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: COLORS.primary,
  },
  addNoteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
  },
  addNoteSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  preViewImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginBottom: 8,
  },
  preViewVideo: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginBottom: 8,
  },
  
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  syncingButton: {
    backgroundColor: '#FF9800',
  },
});
