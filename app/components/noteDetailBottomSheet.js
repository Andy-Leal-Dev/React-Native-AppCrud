import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  TextInput
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Video } from 'expo-av';
import { useAuth } from '../providers/AuthContext';

const NoteDetailBottomSheet = React.forwardRef(({
  snapPoints = ['60%'],
  onChange,
  enablePanDownToClose = true,
  selectedNote,
  handleDeleteNote,
  handleUpdateNote,
  timeAgo
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDetails, setEditedDetails] = useState('');
  const { isAuthenticated } = useAuth();
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);
  const [deletedLocalMedia, setDeletedLocalMedia] = useState([]);
  
  useEffect(() => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedDetails(selectedNote.details || '');
    }
  }, [selectedNote]);

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

  const handleDeleteMedia = (mediaId, isLocal = false, mediaIndex, mediaType) => {
    if (isLocal) {
      // Para medios locales
      const updatedNote = { ...selectedNote };
      if (mediaType === 'image') {
        updatedNote.images = updatedNote.images.filter((_, i) => i !== mediaIndex);
      } else if (mediaType === 'video') {
        updatedNote.videos = updatedNote.videos.filter((_, i) => i !== mediaIndex);
      }
      setSelectedNote(updatedNote);
      setDeletedLocalMedia([...deletedLocalMedia, { mediaIndex, mediaType }]);
    } else {
      // Para medios del backend
      setDeletedMediaIds([...deletedMediaIds, mediaId]);
    }
  };

  const handleSaveChanges = () => {
    if (!selectedNote) return;
    
    if (isAuthenticated) {
      // Para usuario autenticado
      handleUpdateNote(selectedNote.id, {
        title: editedTitle,
        details: editedDetails,
        idCode: selectedNote.idCode,
        deletedMediaIds: deletedMediaIds.length > 0 ? deletedMediaIds : undefined
      });
      Alert.alert("Éxito", "Nota actualizada correctamente");
    } else {
      // Para usuario no autenticado
      const updatedNote = {
        ...selectedNote,
        title: editedTitle,
        details: editedDetails
      };
      
      // Aplicar eliminaciones de medios locales
      deletedLocalMedia.forEach(({ mediaIndex, mediaType }) => {
        if (mediaType === 'image' && updatedNote.images) {
          updatedNote.images = updatedNote.images.filter((_, i) => i !== mediaIndex);
        } else if (mediaType === 'video' && updatedNote.videos) {
          updatedNote.videos = updatedNote.videos.filter((_, i) => i !== mediaIndex);
        }
      });

      Alert.alert(
        "Cambios guardados localmente",
        "Los cambios se han guardado en tu dispositivo. Inicia sesión para sincronizarlos con la nube.",
        [{ text: "Entendido" }]
      );
      handleUpdateNote(selectedNote.id, updatedNote);
    }
    
    // Resetear estados de eliminación
    setDeletedMediaIds([]);
    setDeletedLocalMedia([]);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(selectedNote.title);
    setEditedDetails(selectedNote.details || '');
    setDeletedMediaIds([]);
    setDeletedLocalMedia([]);
    setIsEditing(false);
  };

  const renderMediaItem = (media, idx, type, isLocal = false) => {
    const isLocalMedia = isLocal || (media.uri && !media.uri.startsWith('http'));
    const sourceUri = isLocalMedia ? media.uri : 'https://backend-noteeasy-appcrud.onrender.com/' + (media.filePath || '');
    const mediaId = media.id || `local-${idx}-${type}`;
    
    return (
      <Pressable 
        key={mediaId} 
        style={styles.mediaItem}
      >
        {type === 'image' ? (
          <>
            <Image 
              source={{ uri: sourceUri }} 
              style={styles.mediaThumbnail} 
              onPress={() => openMediaViewer(media, type)}
            />
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaName} numberOfLines={1}>{media.originalName || media.fileName || 'Imagen'}</Text>
              <Text style={styles.mediaSize}>
                {media.fileSize ? (
                  media.fileSize < 1024 * 1024 ? 
                    `${(media.fileSize / 1024).toFixed(2)} KB` : 
                    `${(media.fileSize / (1024 * 1024)).toFixed(2)} MB`
                ) : 'Tamaño desconocido'}
              </Text>
              {isLocalMedia && (
                <Text style={styles.localBadge}>Local</Text>
              )}
            </View>
            <Ionicons 
              name="eye-outline" 
              size={24} 
              color={COLORS.primary} 
              onPress={() => openMediaViewer(media, type)}
              style={styles.mediaActionIcon}
            />
            {isEditing && (
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color="#f44336" 
                onPress={() => handleDeleteMedia(
                  media.id, 
                  isLocalMedia, 
                  idx, 
                  type
                )}
                style={styles.mediaActionIcon}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.videoThumb}>
              <MaterialIcons name="movie" size={30} color={COLORS.primary} />
            </View>
            <View style={styles.mediaInfo}>
              <Text style={styles.mediaName} numberOfLines={1}>{media.originalName || media.fileName || 'Video'}</Text>
              <Text style={styles.mediaSize}>
                {media.fileSize ? (
                  media.fileSize < 1024 * 1024 ? 
                    `${(media.fileSize / 1024).toFixed(2)} KB` : 
                    `${(media.fileSize / (1024 * 1024)).toFixed(2)} MB`
                ) : 'Tamaño desconocido'}
              </Text>
              {isLocalMedia && (
                <Text style={styles.localBadge}>Local</Text>
              )}
            </View>
            <Ionicons 
              name="eye-outline" 
              size={24} 
              color={COLORS.primary} 
              onPress={() => openMediaViewer(media, type)}
              style={styles.mediaActionIcon}
            />
            {isEditing && (
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color="#f44336" 
                onPress={() => handleDeleteMedia(
                  media.id, 
                  isLocalMedia, 
                  idx, 
                  type
                )}
                style={styles.mediaActionIcon}
              />
            )}
          </>
        )}
      </Pressable>
    );
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
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={editedTitle}
                      onChangeText={setEditedTitle}
                      placeholder="Título de la nota"
                    />
                    <TextInput
                      style={[styles.editInput, styles.detailsInput]}
                      value={editedDetails}
                      onChangeText={setEditedDetails}
                      placeholder="Detalles de la nota"
                      multiline
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.textTitleNote}>{selectedNote.title}</Text>
                    <Text style={{ marginBottom: 10, color: COLORS.muted }}>
                      {selectedNote.date || selectedNote.createdAt}
                    </Text>
                    <Text style={styles.detailsText}>{selectedNote.details}</Text>
                  </>
                )}
                
                {(selectedNote.media && selectedNote.media.length > 0) || 
                  (selectedNote.images && selectedNote.images.length > 0) || 
                  (selectedNote.videos && selectedNote.videos.length > 0) ? (
                  <View>
                    <Text style={styles.mediaTitle}>Archivos adjuntos:</Text>
                    
                    {/* Mostrar imágenes del backend */}
                    {selectedNote.media && selectedNote.media
                      .filter(media => media.fileType === 'image')
                      .map((media, idx) => 
                        renderMediaItem(media, idx, 'image', false)
                      )}
                    
                    {/* Mostrar videos del backend */}
                    {selectedNote.media && selectedNote.media
                      .filter(media => media.fileType === 'video')
                      .map((media, idx) => 
                        renderMediaItem(media, idx, 'video', false)
                      )}
                    
                    {/* Mostrar imágenes locales */}
                    {selectedNote.images && selectedNote.images.map((media, idx) => 
                      renderMediaItem(media, idx, 'image', true)
                    )}
                    
                    {/* Mostrar videos locales */}
                    {selectedNote.videos && selectedNote.videos.map((media, idx) => 
                      renderMediaItem(media, idx, 'video', true)
                    )}
                  </View>
                ) : null}
                
                <View style={styles.buttonRow}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSaveChanges}
                      >
                        <Text style={styles.actionButtonText}>Guardar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.actionButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => setIsEditing(true)}
                    >
                      <Text style={styles.actionButtonText}>Editar Nota</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteNote(selectedNote.id)}
                  >
                    <Text style={styles.actionButtonText}>Eliminar Nota</Text>
                  </TouchableOpacity>
                </View>
                
                {!isAuthenticated && (
                  <View style={styles.authWarning}>
                    <Ionicons name="cloud-offline" size={20} color="#F44336" />
                    <Text style={styles.authWarningText}>
                      Nota guardada localmente. Inicia sesión para sincronizar con la nube.
                    </Text>
                  </View>
                )}
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
                  source={{ uri: selectedMedia.uri || 'https://backend-noteeasy-appcrud.onrender.com/' + (selectedMedia.filePath || '') }} 
                  style={styles.fullMedia} 
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: selectedMedia.uri || 'https://backend-noteeasy-appcrud.onrender.com/' + (selectedMedia.filePath || '') }}
                  style={styles.fullMedia}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}
              
              <View style={styles.mediaDetails}>
                <Text style={styles.mediaDetailText}>{selectedMedia.originalName || selectedMedia.fileName || 'Archivo'}</Text>
                <Text style={styles.mediaDetailText}>
                  {selectedMedia.fileSize ? (
                    mediaType === 'image' 
                      ? `${(selectedMedia.fileSize / 1024).toFixed(2)} KB` 
                      : `${(selectedMedia.fileSize / (1024 * 1024)).toFixed(2)} MB`
                  ) : 'Tamaño desconocido'}
                </Text>
                {(selectedMedia.uri && !selectedMedia.uri.startsWith('http')) && (
                  <Text style={styles.localBadgeModal}>Archivo local</Text>
                )}
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
  mediaActionIcon: {
    padding: 5,
    marginLeft: 5,
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
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: COLORS.card,
  },
  detailsInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  authWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  authWarningText: {
    marginLeft: 8,
    color: '#E65100',
    fontSize: 14,
  },
  localBadge: {
    backgroundColor: '#E3F2FD',
    color: COLORS.primary,
    padding: 2,
    borderRadius: 4,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  localBadgeModal: {
    backgroundColor: '#E3F2FD',
    color: COLORS.primary,
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    marginTop: 8,
  },
});

export default NoteDetailBottomSheet;