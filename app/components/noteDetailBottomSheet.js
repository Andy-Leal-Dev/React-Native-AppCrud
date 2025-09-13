import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from "@expo/vector-icons";

const NoteDetailBottomSheet = React.forwardRef(({
  snapPoints = ['60%'],
  onChange,
  enablePanDownToClose = true,
  selectedNote,
  handleDeleteNote,
  timeAgo
}, ref) => {
  return (
    <BottomSheetModal
      ref={ref}
      onChange={onChange}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
    >
      <BottomSheetView style={styles.contentContainerNote}>
        <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1, width:'100%' }}>
          {selectedNote ? (
            <View style={styles.detailContainer}>
              <Text style={styles.textTitleNote}>{selectedNote.title}</Text>
              <Text style={{ marginBottom: 10 }}>{selectedNote.date || selectedNote.createdAt}</Text>
              <Text style={styles.detailsText}>{selectedNote.details}</Text>
              
              {selectedNote.images && selectedNote.images.length > 0 && (
                <View>
                  <Text style={styles.mediaTitle}>Imágenes:</Text>
                  {selectedNote.images.map((img, idx) => (
                    <View key={idx} style={styles.preViewImage}>
                      <Image source={{ uri: img.uri }} style={styles.image} />
                      <View style={styles.mediaInfo}>
                        <Text>{img.fileName}</Text>
                        <Text>{(img.fileSize / 1024).toFixed(2)} KB</Text>
                        <Text>{timeAgo(new Date(img.addedAt))} atrás</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {selectedNote.videos && selectedNote.videos.length > 0 && (
                <View>
                  <Text style={styles.mediaTitle}>Videos:</Text>
                  {selectedNote.videos.map((vid, idx) => (
                    <View key={idx} style={styles.preViewVideo}>
                      <View style={styles.videoThumb}>
                        <MaterialIcons name="movie" size={40} color="#2196F3" />
                      </View>
                      <View style={styles.mediaInfo}>
                        <Text>{vid.fileName}</Text>
                        <Text>{(vid.fileSize / (1024 * 1024)).toFixed(2)} MB</Text>
                        <Text>{timeAgo(new Date(vid.addedAt))} atrás</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteNote(selectedNote.id)}
              >
                <Text style={styles.deleteButtonText}>Eliminar Nota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text>No hay nota seleccionada</Text>
          )}
        </BottomSheetScrollView>
      </BottomSheetView>
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
  contentContainerNote: {
    padding: 20,

    flex: 1,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailContainer: {
    width: '100%',
    padding: 20,
  },
  textTitleNote: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 16,
    marginBottom: 20,
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
    backgroundColor: '#f44336',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NoteDetailBottomSheet;