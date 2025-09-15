import React from 'react';
import Navigation from './app/utils/navigation';
import { AuthProvider } from './app/providers/AuthContext';
import { SyncProvider } from './app/providers/SyncContext';

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <Navigation/>
      </SyncProvider>
    </AuthProvider>
  );
}