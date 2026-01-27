import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppNavigator from './navigation/AppNavigator';

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
