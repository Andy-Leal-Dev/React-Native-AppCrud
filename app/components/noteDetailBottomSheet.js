import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Video } from 'expo-av';

const NoteDetailBottomSheet = React.forwardRef(({
  snapPoints = ['60%'],
  onChange,
  enablePanDownToClose = true,
  selectedNote,
  handleDeleteNote,
  timeAgo
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState('');

  const openMediaViewer = (media, type) => {
    setSelectedMedia(media);
    setMediaType(type);
    setModalVisible(true);
  };

  const closeMediaViewer = () => {
    setModalVisible(false);
    setSelectedMedia(null);
    setMediaType('');
  };

  return (
    <>
      <BottomSheetModal
        ref={ref}
        onChange={onChange}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
      >
        <BottomSheetView style={styles.contentContainerNote}>
          <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1, width:'100%' }}>
            {selectedNote ? (
              <View key={selectedNote.id} style={styles.detailContainer}>
                <Text style={styles.textTitleNote}>{selectedNote.title}</Text>
                <Text style={{ marginBottom: 10 }}>{selectedNote.date || selectedNote.createdAt}</Text>
                <Text style={styles.detailsText}>{selectedNote.details}</Text>
                
                {selectedNote.media && selectedNote.media.length > 0 && (
                  <View>
                    <Text style={styles.mediaTitle}>Archivos adjuntos:</Text>
                    {selectedNote.media.map((media, idx) => (
                      <Pressable 
                        key={idx} 
                        style={styles.mediaItem}
                        onPress={() => openMediaViewer(media, media.fileType)}
                      >
                        {media.fileType === 'image' ? (
                          <>
                            <Image 
                              source={{ uri: 'https://backend-noteeasy-appcrud.onrender.com/'+ media.filePath }} 
                              style={styles.mediaThumbnail} 
                            />
                            <View style={styles.mediaInfo}>
                              <Text style={styles.mediaName} numberOfLines={1}>{media.originalName || media.fileName}</Text>
                              <Text style={styles.mediaSize}>{(media.fileSize / 1024).toFixed(2)} KB</Text>
                            </View>
                            <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
                          </>
                        ) : (
                          <>
                            <View style={styles.videoThumb}>
                              <MaterialIcons name="movie" size={30} color={COLORS.primary} />
                            </View>
                            <View style={styles.mediaInfo}>
                              <Text style={styles.mediaName} numberOfLines={1}>{media.originalName || media.fileName}</Text>
                              <Text style={styles.mediaSize}>{(media.fileSize / (1024 * 1024)).toFixed(2)} MB</Text>
                            </View>
                            <Ionicons name="eye-outline" size={24} color={COLORS.primary} />
                          </>
                        )}
                      </Pressable>
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

      {/* Modal para visualización completa de medios */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMediaViewer}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={closeMediaViewer}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          
          {selectedMedia && (
            <View style={styles.modalContent}>
              {mediaType === 'image' ? (
                <Image 
                  source={{ uri: 'https://backend-noteeasy-appcrud.onrender.com/'+ selectedMedia.filePath }} 
                  style={styles.fullMedia} 
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: 'https://backend-noteeasy-appcrud.onrender.com/'+ selectedMedia.filePath }}
                  style={styles.fullMedia}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}
              
              <View style={styles.mediaDetails}>
                <Text style={styles.mediaDetailText}>{selectedMedia.originalName || selectedMedia.fileName}</Text>
                <Text style={styles.mediaDetailText}>
                  {mediaType === 'image' 
                    ? `${(selectedMedia.fileSize / 1024).toFixed(2)} KB` 
                    : `${(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
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
    fontSize: 16,
    color: COLORS.primary,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.card,
  },
  mediaThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  videoThumb: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginRight: 10,
  },
  mediaInfo: {
    flex: 1,
    marginRight: 10,
  },
  mediaName: {
    fontSize: 14,
    fontWeight: '500',
  },
  mediaSize: {
    fontSize: 12,
    color: COLORS.muted,
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
  // Estilos para el modal de visualización completa
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 5,
  },
  modalContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: '100%',
    height: '80%',
  },
  mediaDetails: {
    marginTop: 20,
    alignItems: 'center',
  },
  mediaDetailText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
});

export default NoteDetailBottomSheet;