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
  TextInput,
  ActivityIndicator
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Video } from 'expo-av';
import { useAuth } from '../providers/AuthContext';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { notesApi } from '../services/api';
import { 
  addToSyncQueue, 
  generateUniqueId, 

  loadNotesFromCache,
  saveNotesToCache,
  deleteFile
} from '../services/syncServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { copyFileToNotesDir} from '../utils/fileUtils';
import { el } from 'date-fns/locale';
const NOTES_DIR = FileSystem.documentDirectory + 'notes_media/';

const NoteDetailBottomSheet = React.forwardRef(({
  snapPoints = ['80%'],
  onChange,
  enablePanDownToClose = true,
  selectedNoteId,
  onNoteUpdated,
  onNoteDeleted,
  timeAgo
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDetails, setEditedDetails] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [deletedMediaIds, setDeletedMediaIds] = useState([]);
  const [deletedLocalMedia, setDeletedLocalMedia] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLocalNote, setIsLocalNote] = useState(false);
const locale = es; 
  // Fetch note details when selectedNoteId changes
  useEffect(() => {
    if (selectedNoteId) {
      fetchNoteDetails();
    }
  }, [selectedNoteId]);

  const fetchNoteDetails = async () => {
    if (!selectedNoteId) return;
    
    setLoading(true);
    try {
      // Check if it's a local note (no idCode or starts with local-)
      const cachedNotes = await loadNotesFromCache();
      console.log('Cached notes:', cachedNotes);
      const localNote = cachedNotes.find(n => 
        n.id === selectedNoteId || n.idCode === selectedNoteId
      );

      if (localNote && (!localNote.synced || localNote.synced === 0)) {
        // It's a local note
        setNote(localNote);
        setIsLocalNote(true);
        setEditedTitle(localNote.title);
        setEditedDetails(localNote.details || '');
      } else if (localNote && localNote.synced === 1) {
        // It's a synced note, try to fetch from backend first
        try {
          const response = await notesApi.getById(localNote.id);
          setNote(response.data[0]);
          setIsLocalNote(false);
          setEditedTitle(response.data.title);
          setEditedDetails(response.data.details || '');
        } catch (error) {
          console.error('Error fetching from backend, using cached version:', error);
          // Fallback to cached version
          setNote(localNote);
          setIsLocalNote(false);
          setEditedTitle(localNote.title);
          setEditedDetails(localNote.details || '');
        }
      } else {
        // Try to fetch from backend
        try {
          const response = await notesApi.getById(selectedNoteId);
          setNote(response.data[0]);
          setIsLocalNote(false);
          setEditedTitle(response.data.title);
          setEditedDetails(response.data.details || '');
        } catch (error) {
          console.error('Error fetching note from backend:', error);
          Alert.alert('Error', 'No se pudo cargar la nota');
        }
      }
    } catch (error) {
      console.error('Error fetching note details:', error);
      Alert.alert('Error', 'No se pudo cargar la nota');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteMedia = async (mediaId, isLocal = false, mediaIndex, mediaType) => {
    if (isLocal) {
      // For local media - just remove from UI state
      const updatedNote = { ...note };
      if (mediaType === 'image') {
        updatedNote.images = updatedNote.images.filter((_, i) => i !== mediaIndex);
      } else if (mediaType === 'video') {
        updatedNote.videos = updatedNote.videos.filter((_, i) => i !== mediaIndex);
      }
      setNote(updatedNote);
      setDeletedLocalMedia([...deletedLocalMedia, { mediaIndex, mediaType }]);
    } else {
      // For backend media - mark for deletion
      setDeletedMediaIds([...deletedMediaIds, mediaId]);
      
      // Remove from UI immediately
      const updatedNote = { ...note };
      if (mediaType === 'image') {
        updatedNote.media = updatedNote.media.filter(media => 
          !(media.id === mediaId && media.fileType === 'image')
        );
      } else if (mediaType === 'video') {
        updatedNote.media = updatedNote.media.filter(media => 
          !(media.id === mediaId && media.fileType === 'video')
        );
      }
      setNote(updatedNote);
    }
  };

  const handleCancelEdit = () => {
    // Reload original note data
    fetchNoteDetails();
    setDeletedMediaIds([]);
    setDeletedLocalMedia([]);
    setNewImages([]);
    setNewVideos([]);
    setIsEditing(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => ({
        uri: asset.uri,
        addedAt: new Date(),
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize || 0,
        type: 'image/jpeg',
        isNew: true
      }));
      setNewImages(prev => [...prev, ...selectedImages]);
    }
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedVideos = result.assets.map(asset => ({
        uri: asset.uri,
        addedAt: new Date(),
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize || 0,
        type: 'video/mp4',
        isNew: true
      }));
      setNewVideos(prev => [...prev, ...selectedVideos]);
    }
  };

  const handleSaveChanges = async () => {
    if (!note) return;
    
    try {
      if (isAuthenticated && !isLocalNote) {
        // For authenticated user - update via API
        const formData = new FormData();
        if(editedTitle !== null && editedTitle !== note.title){
          formData.append('title', editedTitle);
        } else{
          formData.append('title', note.title);
        }
        if (editedDetails !== null && editedDetails !== note.details){
          formData.append('details', editedDetails);
        }else{
          formData.append('details', note.details );
        }
  
        formData.append('idCode', note.idCode || note.id);
        
        // Add deleted media IDs
        if (deletedMediaIds.length > 0) {
          formData.append('deletedMediaIds', JSON.stringify(deletedMediaIds));
        }

        // Add new images
        for (const img of newImages) {
          const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const newPath = await copyFileToNotesDir(img.uri, fileName);
          
          formData.append('images', {
            uri: newPath,
            type: 'image/jpeg',
            name: fileName
          });
        }

        // Add new videos
        for (const vid of newVideos) {
          const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
          const newPath = await copyFileToNotesDir(vid.uri, fileName);
          
          formData.append('videos', {
            uri: newPath,
            type: 'video/mp4',
            name: fileName
          });
        }

        const response = await notesApi.update(note.id, formData);
      
        if (response.status === 201 || response.status === 302) {
          console.log('Note updated successfully:', response.data);
              // Refresh the note details
          fetchNoteDetails();
          // Update local cache with the new data
          const cachedNotes = await loadNotesFromCache();
          const updatedNotes = cachedNotes.map(n => 
            n.id === note.id ? { ...response.data, synced: 1 } : n
          );
          await saveNotesToCache(updatedNotes);
          
          Alert.alert("Éxito", "Nota actualizada correctamente");
          onNoteUpdated({ ...response.data, synced: 1 });
          
      
        }
      } else {
        // For unauthenticated user or local note - update locally
        const updatedNote = {
          ...note,
          title: editedTitle,
          details: editedDetails,
          images: [...(note.images || []).filter((_, index) => 
            !deletedLocalMedia.some(d => d.mediaIndex === index && d.mediaType === 'image')
          ), ...newImages],
          videos: [...(note.videos || []).filter((_, index) => 
            !deletedLocalMedia.some(d => d.mediaIndex === index && d.mediaType === 'video')
          ), ...newVideos],
          synced: isAuthenticated ? 1 : 0
        };

        // Update local cache
        const cachedNotes = await loadNotesFromCache();
        const updatedNotes = cachedNotes.map(n => 
          n.id === note.id ? updatedNote : n
        );
        await saveNotesToCache(updatedNotes);
        
        // If user is authenticated but note was local, add to sync queue
        if (isAuthenticated && isLocalNote) {
          await addToSyncQueue(updatedNote, 'create');
        } else if (isAuthenticated) {
          await addToSyncQueue(updatedNote, 'update');
        }
        
        Alert.alert(
          isAuthenticated ? "Cambios guardados" : "Cambios guardados localmente",
          isAuthenticated ? 
            "Nota actualizada correctamente" : 
            "Los cambios se han guardado en tu dispositivo. Inicia sesión para sincronizarlos con la nube.",
          [{ text: "Entendido" }]
        );
        
        // Update local state and refresh
        setNote(updatedNote);
        onNoteUpdated(updatedNote);
      }
      
      // Reset states
      setDeletedMediaIds([]);
      setDeletedLocalMedia([]);
      setNewImages([]);
      setNewVideos([]);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert("Error", "No se pudo guardar los cambios");
    }
  };

  const handleDeleteNote = async () => {
    if (!note) return;
    
    Alert.alert(
      "Eliminar nota",
      "¿Estás seguro de que quieres eliminar esta nota?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              if (isAuthenticated && !isLocalNote) {
                // Delete from backend
                await notesApi.delete(note.id);
                
                // Also remove from local cache
                const cachedNotes = await loadNotesFromCache();
                const updatedNotes = cachedNotes.filter(n => n.id !== note.id);
                await saveNotesToCache(updatedNotes);
                
                Alert.alert("Éxito", "Nota eliminada correctamente");
              } else {
                // Delete locally and from sync queue if needed
                const cachedNotes = await loadNotesFromCache();
                const updatedNotes = cachedNotes.filter(n => n.id !== note.id);
                await saveNotesToCache(updatedNotes);
                
                // If note was synced, add to delete queue
                if (note.synced === 1) {
                  await addToSyncQueue(note, 'delete');
                }
                
                Alert.alert(
                  isLocalNote ? "Nota eliminada localmente" : "Nota eliminada",
                  isLocalNote ? 
                    "La nota se ha eliminado de tu dispositivo." :
                    "Nota eliminada correctamente.",
                  [{ text: "Entendido" }]
                );
              }
              
              onNoteDeleted(note.id);
              ref.current?.dismiss();
              
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert("Error", "No se pudo eliminar la nota");
            }
          }
        }
      ]
    );
  };

  const deleteMediaFromBackend = async (mediaId) => {
    try {
      Alert.alert("Eliminar Archivo","Estas Seguro de borrar esta imagen?",[
        {text:"Cancelar"},
        {text: "Eliminar archivo", onPress:async()=>{
            const response = await notesApi.deleteMedia(mediaId);
      if(response.status== 200 || response.status ==201){
        fetchNoteDetails();
      }
        }}
      ])
    
       return true;
    } catch (error) {
      console.error('Error deleting media from backend:', error);
      return false;
    }
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
          
            
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color="#f44336" 
                onPress={() => deleteMediaFromBackend(
                  media.id, 
                  isLocalMedia, 
                  idx, 
                  type
                )}
                style={styles.mediaActionIcon}
              />
            
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

  if (loading) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Cargando nota...</Text>
        </View>
      </BottomSheetModal>
    );
  }

  if (!note) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
      >
        <View style={styles.errorContainer}>
          <Text>No se pudo cargar la nota</Text>
        </View>
      </BottomSheetModal>
    );
  }

 
  return (
    console.log('Rendering note:', note),
    <>
      <BottomSheetModal
        ref={ref}
        onChange={onChange}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
      >
        <BottomSheetView style={styles.contentContainerNote}>
          <BottomSheetScrollView contentContainerStyle={{ flexGrow: 1, width:'100%' }}>
            <View style={styles.detailContainer}>
              {/* Sync status indicator */}
              <View style={styles.syncStatusContainer}>
                {isLocalNote ? (
                  <View style={[styles.statusBadge, styles.localBadge]}>
                    <Ionicons name="cloud-offline" size={16} color="#F44336" />
                    <Text style={styles.statusText}>Local</Text>
                  </View>
                ) : note.synced == 1 ? (
                  <View style={[styles.statusBadge, styles.syncedBadge]}>
                    <Ionicons name="cloud-done" size={16} color="#4CAF50" />
                    <Text style={styles.statusText}>Sincronizado</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.pendingBadge]}>
                    <Ionicons name="sync" size={16} color="#FF9800" />
                    <Text style={styles.statusText}>Pendiente</Text>
                  </View>
                )}
              </View>

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
                  <Text style={styles.textTitleNote}>{note.title}</Text>
                  <Text style={{ marginBottom: 10, color: COLORS.muted }}>
                    {note.date ||note.createdAt}
                  </Text>
                  <Text style={styles.detailsText}>{note.details}</Text>
                </>
              )}
              
              {/* Media sections */}
              {(note.media && note.media.length > 0) || 
               (note.images && note.images.length > 0) || 
               (note.videos && note.videos.length > 0) ? (
                <View>
                  <Text style={styles.mediaTitle}>Archivos adjuntos:</Text>
                 
                  {/* Backend images */}
                  {note.media && note.media
                    .filter(media => media.fileType === 'image')
                    .map((media, idx) => 
                      renderMediaItem(media, idx, 'image', false)
                    )}
            
                  {/* Backend videos */}
                  {note.media && note.media
                    .filter(media => media.fileType === 'video')
                    .map((media, idx) => 
                      renderMediaItem(media, idx, 'video', false)
                    )}
                  
                  {/* Local images */}
                  {note.images && note.images.map((media, idx) => 
                    renderMediaItem(media, idx, 'image', true)
                  )}
                  
                  {/* Local videos */}
                  {note.videos && note.videos.map((media, idx) => 
                    renderMediaItem(media, idx, 'video', true)
                  )}
                </View>
              ) : null}
              
              {/* New media to be added */}
              {(newImages.length > 0 || newVideos.length > 0) && (
                <View style={styles.newMediaContainer}>
                  <Text style={styles.mediaTitle}>Nuevos archivos por agregar:</Text>
                  {newImages.map((img, idx) => (
                    <View key={`new-img-${idx}`} style={styles.mediaItem}>
                      <Image source={{ uri: img.uri }} style={styles.mediaThumbnail} />
                      <View style={styles.mediaInfo}>
                        <Text style={styles.mediaName} numberOfLines={1}>{img.fileName || 'Imagen'}</Text>
                        <Text style={styles.mediaSize}>
                          {img.fileSize ? `${(img.fileSize / 1024).toFixed(2)} KB` : 'Tamaño desconocido'}
                        </Text>
                        <Text style={styles.newBadge}>Nuevo</Text>
                      </View>
                      <Ionicons 
                        name="trash-outline" 
                        size={24} 
                        color="#f44336" 
                        onPress={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                        style={styles.mediaActionIcon}
                      />
                    </View>
                  ))}
                  {newVideos.map((vid, idx) => (
                    <View key={`new-vid-${idx}`} style={styles.mediaItem}>
                      <View style={styles.videoThumb}>
                        <MaterialIcons name="movie" size={30} color={COLORS.primary} />
                      </View>
                      <View style={styles.mediaInfo}>
                        <Text style={styles.mediaName} numberOfLines={1}>{vid.fileName || 'Video'}</Text>
                        <Text style={styles.mediaSize}>
                          {vid.fileSize ? `${(vid.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Tamaño desconocido'}
                        </Text>
                        <Text style={styles.newBadge}>Nuevo</Text>
                      </View>
                      <Ionicons 
                        name="trash-outline" 
                        size={24} 
                        color="#f44336" 
                        onPress={() => setNewVideos(newVideos.filter((_, i) => i !== idx))}
                        style={styles.mediaActionIcon}
                      />
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add media buttons (only in edit mode) */}
              {isEditing && (
                <View style={styles.addMediaButtons}>
                  <TouchableOpacity
                    style={styles.addMediaButton}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="add-a-photo" size={20} color="white" />
                    <Text style={styles.addMediaText}>Agregar Imágenes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addMediaButton}
                    onPress={pickVideo}
                  >
                    <MaterialIcons name="movie" size={20} color="white" />
                    <Text style={styles.addMediaText}>Agregar Videos</Text>
                  </TouchableOpacity>
                </View>
              )}
              
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
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        setEditedTitle(note.title);
                        setEditedDetails(note.details || '');
                        setIsEditing(true);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Editar Nota</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDeleteNote}
                    >
                      <Text style={styles.actionButtonText}>Eliminar Nota</Text>
                    </TouchableOpacity>
                  </>
                )}
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
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

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
    syncStatusContainer: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    marginBottom: 5,
  },
  localBadge: {
    backgroundColor: '#FFEBEE',
  },
  syncedBadge: {
    backgroundColor: '#E8F5E8',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    marginTop: 20,
    backgroundColor: COLORS.primary,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  deleteButtonStyle: {
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
  addMediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    gap: 20,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
  },
  addMediaText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  newMediaContainer: {
    width: '100%',
    marginTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  newBadge: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
    padding: 2,
    borderRadius: 4,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});

export default NoteDetailBottomSheet;