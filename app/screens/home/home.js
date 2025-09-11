import React, { useRef, useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Pressable } from "react-native";
import Constants from 'expo-constants';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import note from "../../jsons/notes.json";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';

export default function HomeScreen() {
  const addNoteSheetRef = useRef(null);
  const detailSheetRef = useRef(null);
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
          
          {/* BottomSheetModal para agregar nota */}
          <BottomSheetModal
            ref={addNoteSheetRef}
            onChange={handleSheetChanges}
            snapPoints={['50%']}
          >
            <BottomSheetView style={styles.contentContainer} >
              <View style={styles.creatNote}>
                <Text style={{ fontSize: 20, fontWeight: '600' }}>Agregar Nueva Nota</Text>
                <View style={styles.creatNoteOptions}>
                  <Pressable
                    style={{
                      backgroundColor: '#449DD1',
                      padding: 6,
                      borderRadius: 30
                    }}
                    onPress={() => console.log('Guardar Nota')}
                  >
                    <MaterialIcons name="add-a-photo" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    style={{
                      backgroundColor: '#449DD1',
                      padding: 6,
                      borderRadius: 30
                    }}
                    onPress={() => console.log('Guardar Nota')}
                  >
                    <MaterialIcons name="movie" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    style={{
                      backgroundColor: '#449DD1',
                      padding: 6,
                      borderRadius: 30
                    }}
                    onPress={() => console.log('Guardar Nota')}
                  >
                    <MaterialIcons name="add" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
              <View style={styles.inputCreateNote}>
                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>Titulo de la Nota</Text>
                <TextInput
                  style={styles.inputSearch}
                  placeholder="Ingrese el Titulo de la Nota"
                />
              </View>
              <View style={styles.inputCreateNote}>
                <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10, marginTop: 20 }}>Detalles de la Nota</Text>
                <TextInput
                  style={styles.inputDetailsNote}
                  placeholder="Ingrese los detalles de la Nota"
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
            </BottomSheetView>
          </BottomSheetModal>

          {/* BottomSheetModal para ver detalles de la nota */}
          <BottomSheetModal
            ref={detailSheetRef}
            onChange={handleSheetChanges}
            snapPoints={['60%']}
          >
            <BottomSheetView style={styles.contentContainerNote} >
              {selectedNote ? (
                <View style={{ width: '100%' }}>
                  <TextInput style={styles.textTitleNote} value={selectedNote.title}/>
                  <Text style={{ marginBottom: 10 }}>{selectedNote.date}</Text>
                  <TextInput multiline={true} style={{ fontSize: 16, height: 'auto' }} value={selectedNote.details}/>
                </View>
              ) : (
                <Text>No hay nota seleccionada</Text>
              )}
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
    backgroundColor: '#E8E9F3 '
  },
  
  header: {
    paddingTop: 20,
    paddingHorizontal: 5,
    alignContent: 'flex-start',
    justifyContent: 'flex-start'
  },
  textHeader: {
    fontSize: 25,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 10
  },
  ViewSearch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 380,
    height: 60,
    backgroundColor: '#D3D3D3',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 20
  },
  inputSearch: {
    width: 250,
  },
  btnSearch: {},
  containerCardNote: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardNote: {
    width: "95%",
    height: 150,
    borderRadius: 20,
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 20
  },
  viewCardNote: {
    padding: 10
  },
  textTitleNote: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  textCardNote: {
    marginTop: 5,
  },
  textDetails: {
    marginTop: 15,
  },
  floatingButton: {
    backgroundColor: '#449DD1',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    right: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center'
  },
  contentContainerNote: {
    padding: 20,
    flex: 1,
    alignItems: 'center'
  },
  containerHeadline: {
    
    fontSize: 24,
    fontWeight: '600',
    padding: 20
  },
  creatNote:{
    gap:20,
    with: '100%',
    marginTop: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center'
  },
  inputCreateNote: {
    width: '90%',
    borderColor: 'gray',
  },
  inputDetailsNote: {
    width: '100%',
  
    height: 150,
    textAlignVertical: 'top'
  },

  creatNoteOptions:{
  
    gap:20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    
  }
});
