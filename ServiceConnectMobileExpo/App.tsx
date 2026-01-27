import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
    return (
        <AuthProvider>
            <SocketProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </SocketProvider>
        </AuthProvider>
    );
};

export default App;
