import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './profile';
import LoginScreen from '../login';
import RegisterScreen from '../signup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useAuth } from '../../providers/AuthContext';
const Stack = createStackNavigator();

const StackNavigator = () => {
const { isAuthenticated, isLoading } = useAuth();


      return (
    <Stack.Navigator initialRouteName={isAuthenticated ? "Profile" : "Login"}>
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Signup" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;