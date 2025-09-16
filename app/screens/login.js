import React, { useState } from 'react';
import { View, Text, Platform,Keyboard,TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import logo from '../../assets/logoBg.png';
import { ScrollView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/AuthContext';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { checkAuthStatus}= useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.login(email, password);
            
            // Guardar token y datos de usuario
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            await checkAuthStatus();
            // Navegar a la pantalla principal
            navigation.navigate('Home');    
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };
    return (
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
               <View style={styles.container}>
            
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
<Image source={logo} style={styles.logo} />
                <View style={styles.form}>
                <Text style={styles.title}>Inicia Sesión</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#aaa"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
                    <Text style={styles.btnText}>Entrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Signup')}>
                    <Text style={styles.btnSecondaryText}>¿No tienes cuenta? Regístrate</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
      
        backgroundColor: '#f2f6fc',
        paddingTop: Constants.statusBarHeight,
    },
    logo: {
        width: 220,
        height: 220,
        alignSelf: 'center',
        marginBottom: 10,
        borderRadius: 60,
        backgroundColor: '#fff',
        elevation: 4,
    },
    form: {
        gap: 16,
        marginHorizontal: 9,
        padding: 24,
        width: "95%",
        borderRadius: 24,
        backgroundColor: "#fff",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#2196F3',
        letterSpacing: 1,
    },
    input: {
        height: 50,
        borderColor: '#e3e3e3',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        fontSize: 16,
        backgroundColor: '#f7f9fc',
        color: '#333',
    },
    btnPrimary: {
        borderRadius: 14,
        height: 50,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
    },
    btnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    btnSecondary: {
        marginTop: 8,
        alignItems: 'center',
        paddingVertical: 10,
    },
    btnSecondaryText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});