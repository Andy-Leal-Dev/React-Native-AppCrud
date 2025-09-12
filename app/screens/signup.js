import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform,StyleSheet,Keyboard, Image, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import logo from '../../assets/logoBg.png';
import { ScrollView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
export default function RegisterScreen({ navigation }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.register({
                firstName,
                lastName,
                email,
                password
            });
            
            // Guardar token y datos de usuario
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
            
            // Navegar a la pantalla principal
            navigation.navigate('Home');
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
             <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={logo} style={styles.logo} />
            <View style={styles.form}>
                <Text style={styles.title}>Regístrate</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre "
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor="#aaa"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Apellido"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor="#aaa"
                />
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
                <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister}>
                    <Text style={styles.btnText}>Registrarse</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.btnSecondaryText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
        paddingTop: Constants.statusBarHeight,
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f2f6fc',
        
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