import React, { useRef, useCallback, useState } from "react";
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

export default function HomeScreen() {
  const addNoteSheetRef = useRef(null);
  const detailSheetRef = useRef(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

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
        addedAt: new Date()
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
        addedAt: new Date()
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
              {note['data'].map((item, idx) => (
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
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "android" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <BottomSheetScrollView style={styles.contentContainer}> {/* Use BottomSheetScrollView here */}
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
                  <BottomSheetTextInput style={styles.inputSearch} placeholder="Ingrese el Titulo de la Nota" />
                </View>
                <View style={styles.inputCreateNote}>
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10, marginTop: 20 }}>Detalles de la Nota</Text>
                  <BottomSheetTextInput style={styles.inputDetailsNote}
                    placeholder="Ingrese los detalles de la Nota"
                    multiline={true}
                    numberOfLines={10} />
                </View>
                {/* Mostrar imágenes */}
                {images.length > 0 && (
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Imágenes:</Text>
                    {images.map((img, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Image source={{ uri: img.uri }} style={styles.image} />
                        <Text style={{ marginLeft: 10 }}>{timeAgo(img.addedAt)} atrás</Text>
                      </View>
                    ))}
                  </View>
                )}
                {/* Mostrar videos */}
                {videos.length > 0 && (
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Videos:</Text>
                    {videos.map((vid, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ width: 100, height: 100, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialIcons name="movie" size={40} color="#2196F3" />
                        </View>
                        <Text style={{ marginLeft: 10 }}>{timeAgo(vid.addedAt)} atrás</Text>
                      </View>
                    ))}
                  </View>
                )}
              </BottomSheetScrollView>
            </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    paddingHorizontal: 10,
    height: '100%',
    backgroundColor: '#f2f6fc',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 5,
    alignContent: 'flex-start',
    justifyContent: 'flex-start',
  },
  textHeader: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 10,
    color: '#111',
  },
  ViewSearch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: '#f2f6fc',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    shadowColor: '#2196F3',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputSearch: {
    width: '80%',
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  containerCardNote: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardNote: {
    width: "96%",
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: "#f2f6fc",
    elevation: 4,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  viewCardNote: {
    padding: 16,
  },
  textTitleNote: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  textCardNote: {
    marginTop: 3,
    color: '#111',
    fontSize: 15,
  },
  textDetails: {
    marginTop: 12,
    color: '#2196F3',
    fontWeight: '500',
    fontSize: 14,
  },
  floatingButton: {
    backgroundColor: '#2196F3',
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 30,
    elevation: 6,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  contentContainerNote: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
  },
  creatNote: {
    gap: 50,
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  creatNoteOptions: {
    gap: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputCreateNote: {
    width: '90%',
    borderColor: '#e3e3e3',
    marginBottom: 10,
  },
  inputDetailsNote: {
    width: '100%',
    minHeight: 150,
    maxHeight: 200,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    color: '#111',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  containerHeadline: {
    fontSize: 24,
    fontWeight: '600',
    padding: 20,
    color: '#111',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  image: {
    width: 200,
    height: 200,
  },
});