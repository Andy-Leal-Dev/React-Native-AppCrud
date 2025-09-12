import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";


const AddNoteBottomSheet = React.forwardRef(({
  snapPoints = ['80%'],
  onChange,
  enablePanDownToClose = true,
  newTitle,
  setNewTitle,
  newDetails,
  setNewDetails,
  images,
  setImages,
  videos,
  setVideos,
  pickImage,
  pickVideo,
  handleAddNote,
  timeAgo
}, ref) => {
  return (
    <BottomSheetModal
      ref={ref}
      onChange={onChange}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
    >
      <BottomSheetScrollView style={{flex: 1, paddingHorizontal: 20}} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}> 
        <View style={styles.creatNote}>
          <Text style={{ fontSize: 20, fontWeight: '600' }}>Agregar Nueva Nota</Text>
          <View style={styles.creatNoteOptions}>
            <Pressable
              style={styles.optionButton}
              onPress={pickImage}
            >
              <MaterialIcons name="add-a-photo" size={20} color="white" />
            </Pressable>
            <Pressable
              style={styles.optionButton}
              onPress={pickVideo}
            >
              <MaterialIcons name="movie" size={20} color="white" />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.inputCreateNote}>
          <Text style={styles.label}>Titulo de la Nota</Text>
          <BottomSheetTextInput
            style={styles.inputSearch}
            placeholder="Ingrese el Titulo de la Nota"
            value={newTitle}
            onChangeText={setNewTitle}
          />
        </View>
        
        <View style={styles.inputCreateNote}>
          <Text style={styles.label}>Detalles de la Nota</Text>
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
          <View style={styles.mediaContainer}>
            <Text style={styles.mediaTitle}>Imágenes:</Text>
            {images.map((img, idx) => (
              <View key={idx} style={styles.preViewImage}>
                <Image source={{ uri: img.uri }} style={styles.image} />
                <View style={styles.mediaInfo}>
                  <Text>{img.fileName}</Text>
                  <Text>{(img.fileSize / 1024).toFixed(2)} KB</Text>
                  <Text>{timeAgo(img.addedAt)} atrás</Text>
                </View>
                <Pressable 
                  style={styles.deleteButton} 
                  onPress={() => setImages(images.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close-circle" size={30} color="#f44336" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        {videos.length > 0 && (
          <View style={styles.mediaContainer}>
            <Text style={styles.mediaTitle}>Videos:</Text>
            {videos.map((vid, idx) => (
              <View key={idx} style={styles.preViewVideo}>
                <View style={styles.videoThumb}>
                  <MaterialIcons name="movie" size={40} color="#2196F3" />
                </View>
                <View style={styles.mediaInfo}>
                  <Text>{vid.fileName}</Text>
                  <Text>{(vid.fileSize / (1024 * 1024)).toFixed(2)} MB</Text>
                  <Text>{timeAgo(vid.addedAt)} atrás</Text>
                </View>
                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => setVideos(videos.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close-circle" size={30} color="#f44336" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAddNote}
        >
          <Text style={styles.saveButtonText}>Guardar Nota</Text>
        </TouchableOpacity>
        <Text style={{height: 30}}/>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

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
  creatNote: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
 
  },
  creatNoteOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#449DD1',
    padding: 6,
    borderRadius: 30
  },
  inputCreateNote: {
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  inputSearch: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  mediaContainer: {
    width: '100%',
    marginTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  mediaTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  preViewImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginBottom: 8,
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
  mediaInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 5,
  },
  deleteButton: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddNoteBottomSheet;