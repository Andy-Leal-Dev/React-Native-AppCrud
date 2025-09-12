import { useRef, useCallback, useState, useEffect } from "react";
import { MMKV } from 'react-native-mmkv';
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
  BottomSheetScrollView // Import BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';

// Función para calcular tiempo relativo
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seg`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

const storage = new MMKV();

function getNotesFromCache() {
  const cached = storage.getString('notes');
  return cached ? JSON.parse(cached) : note.data;
}

export default function HomeScreen() {
  const addNoteSheetRef = useRef(null);
  const detailSheetRef = useRef(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  // NUEVO: Estado para notas
  const [notes, setNotes] = useState(getNotesFromCache());

  // NUEVO: Estados para inputs de nueva nota
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  // Guardar notas en cache cada vez que cambian
  useEffect(() => {
    storage.set('notes', JSON.stringify(notes));
  }, [notes]);

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

  // NUEVO: Agregar nota
  const handleAddNote = () => {
    if (!newTitle.trim()) return;
    const newNote = {
      title: newTitle,
      date: new Date().toLocaleDateString('es-ES'),
      details: newDetails,
      images,
      videos,
    };
    setNotes([...notes, newNote]);
    setNewTitle('');
    setNewDetails('');
    setImages([]);
    setVideos([]);
    addNoteSheetRef.current?.close();
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
       console.log(newImages);
      console.log(result)
      console.log(assets)
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
              <Text style={styles.textHeader}>Hola! Pedro XXXXXX</Text>
              <View style={styles.ViewSearch}>
                <TextInput placeholder="Ingrese el Titulo de la Nota" />
                <TouchableOpacity>
                  <Ionicons name="search-sharp" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
            <View key={'0'} style={styles.containerCardNote}>
              {notes.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={styles.cardNote}
                  onPress={() => handlePresentDetailSheet(item)}
                >
                  <View style={styles.viewCardNote}>
                    <Text style={styles.textTitleNote}>{item.title}</Text>
                    <Text style={styles.textCardNote}>{item.date}</Text>
                    <Text
                      style={styles.textCardNote}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >{item.details}</Text>
                    <Text style={styles.textDetails}>Presiona para ver más detalles</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <Text style={{height:30}}/>
          </ScrollView>
          <TouchableOpacity style={styles.floatingButton} onPress={handlePresentAddNoteSheet}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

          {/* BottomSheetModal para agregar nueva nota */}
          <BottomSheetModal
            ref={addNoteSheetRef}
            onChange={handleSheetChanges}
            snapPoints={['80%']}
            enablePanDownToClose={true}
            style={{ flex: 1,  marginTop: Constants.statusBarHeight, }}
          >
            <BottomSheetScrollView style={{flex:1, height:'100%', }}> 
              <View style={styles.creatNote}>
                <Text style={{ fontSize: 20, fontWeight: '600' }}>Agregar Nueva Nota</Text>
                <View style={styles.creatNoteOptions}>
                  <Pressable
                    style={{
                      backgroundColor: '#449DD1',
                      padding: 6,
                      borderRadius: 30
                    }}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="add-a-photo" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    style={{
                      backgroundColor: '#449DD1',
                      padding: 6,
                      borderRadius: 30
                    }}
                    onPress={pickVideo}
                  >
                    <MaterialIcons name="movie" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
              <View style={styles.inputCreateNote}>
                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>Titulo de la Nota</Text>
                <BottomSheetTextInput
                  style={styles.inputSearch}
                  placeholder="Ingrese el Titulo de la Nota"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>
              <View style={styles.inputCreateNote}>
                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10, marginTop: 20 }}>Detalles de la Nota</Text>
                <BottomSheetTextInput
                  style={styles.inputDetailsNote}
                  placeholder="Ingrese los detalles de la Nota"
                  multiline={true}
                  numberOfLines={10}
                  value={newDetails}
                  onChangeText={setNewDetails}
                />
              </View>
              
              {images.length > 0 && (
                <View style={{ width: '100%', marginTop: 10, paddingBottom:20, paddingLeft:10 , paddingRight:10  }}>
                  <Text style={{ fontWeight: 'bold' }}>Imágenes:</Text>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.preViewImage}>
                      <Image source={{ uri: img.uri }} style={styles.image} />
                      <View style={{ flex: 1, justifyContent: 'flex-start', gap: 5 }}>
                        <Text>{img.fileName}</Text>
                        <Text >{(img.fileSize / 1024).toFixed(2)} KB</Text>
                        <Text >{timeAgo(img.addedAt)} atrás</Text>
                      </View>
                      <Pressable style={{ padding: 5 }}>
                        <Ionicons name="close-circle" size={30} color="#f44336" onPress={() => {
                          setImages(images.filter((_, i) => i !== idx));
                        }} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              {/* Mostrar videos */}
              {videos.length > 0 && (
                <View style={{ width: '100%', marginTop: 10,  paddingBottom:20, paddingLeft:10 , paddingRight:10 }}>
                  <Text style={{ fontWeight: 'bold' }}>Videos:</Text>
                  {videos.map((vid, idx) => (
                    <View key={idx} style={styles.preViewVideo}>
                      <View style={styles.videoThumb}>
                        <MaterialIcons name="movie" size={40} color="#2196F3" />
                      </View>
                      <View style={{ flex: 1, justifyContent: 'flex-start', gap: 5 }}>
                        <Text>{vid.fileName}</Text>
                        <Text >{(vid.fileSize / (1024 * 1024)).toFixed(2)} MB</Text>
                        <Text >{timeAgo(vid.addedAt)} atrás</Text>
                      </View>
                      <Pressable style={{ padding: 5 }}>
                        <Ionicons name="close-circle" size={30} color="#f44336" onPress={() => {
                          setVideos(videos.filter((_, i) => i !== idx));
                        }} />
                      </Pressable>
                   </View>
                    
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  padding: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  margin: 20,
                }}
                onPress={handleAddNote}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Guardar Nota</Text>
              </TouchableOpacity>
              <Text style={{height:30}}/>
            </BottomSheetScrollView>
          </BottomSheetModal>

          {/* BottomSheetModal para ver detalles de la nota */}
          <BottomSheetModal
            ref={detailSheetRef}
            onChange={handleSheetChanges}
            snapPoints={['60%']}
            enablePanDownToClose={true}
          >
            <BottomSheetView style={styles.contentContainerNote}> {/* Use BottomSheetView for the container */}
              <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1 }}> {/* Use BottomSheetScrollView here */}
                {selectedNote ? (
                  <View style={{ width: '100%' }}>
                    <BottomSheetTextInput style={styles.textTitleNote} value={selectedNote.title} />
                    <Text style={{ marginBottom: 10 }}>{selectedNote.date}</Text>
                    <BottomSheetTextInput multiline={true} style={{ fontSize: 16, height: 'auto' }} value={selectedNote.details} />
                  </View>
                ) : (
                  <Text>No hay nota seleccionada</Text>
                )}
              </BottomSheetScrollView>
            </BottomSheetView>
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}


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
  }
});
