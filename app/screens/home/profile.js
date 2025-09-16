import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView } from "react-native";
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableWithoutFeedback } from "@gorhom/bottom-sheet";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from "react";
const NOTES_CACHE_KEY = '@notes_cache';
const SYNC_QUEUE_KEY = '@sync_queue';
const ID_CODE_MAP_KEY = '@id_code_map';
import { useAuth } from '../../providers/AuthContext';
export default function ProfileScreen({ navigation }) {
 const { user, logout } = useAuth()



  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigation.replace('Login');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

   if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.cardProfile}>
          <Text style={styles.textHeader}>Mi Perfil</Text>
          <Text style={styles.notLoggedText}>No has iniciado sesión</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <MaterialIcons name="login" size={20} color="white" />
            <Text style={styles.loginText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

return (
    <View style={styles.container}>
      <View style={styles.cardProfile}>
        <Text style={styles.textHeader}>Mi Perfil</Text>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }]}>
              <MaterialIcons name="person" size={40} color="#888" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#4f8ef7" />
          <Text style={styles.editText}>Editar perfil</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
 }



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Constants.statusBarHeight,
    backgroundColor: '#f2f2f2',
  },
  cardProfile: {
    width: "90%",
    borderRadius: 20,
    backgroundColor: "white",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  textHeader: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 10
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#4f8ef7',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#888',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8ef7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 2,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
    editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#eaf3ff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editText: {
    color: '#4f8ef7',
    fontSize: 15,
    marginLeft: 6,
    fontWeight: 'bold',
  },
    notLoggedText: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8ef7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
});