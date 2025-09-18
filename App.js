import React from 'react';
import Navigation from './app/utils/navigation';
import { AuthProvider } from './app/providers/AuthContext';
import { SyncProvider } from './app/providers/SyncContext';
import NetInfo from '@react-native-community/netinfo';
import { ToastAndroid } from 'react-native';
import { useEffect } from 'react';
export default function App() {



// En tu componente principal
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    console.log('Connection type', state.type);
    console.log('Is connected?', state.isConnected);
    
 
    if (!state.isConnected) {
          ToastAndroid.show('Conexión perdida', ToastAndroid.SHORT);

    }
  });

  return () => unsubscribe();
}, []);

  return (
    <AuthProvider>
      <SyncProvider>
        <Navigation/>
      </SyncProvider>
    </AuthProvider>
  );
}