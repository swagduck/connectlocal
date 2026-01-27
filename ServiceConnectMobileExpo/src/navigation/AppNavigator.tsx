import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import NearbyWorkersScreen from '../screens/NearbyWorkersScreen';
import CreateServiceScreen from '../screens/CreateServiceScreen';
import MyServicesScreen from '../screens/MyServicesScreen';
import EditServiceScreen from '../screens/EditServiceScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PostRequestScreen from '../screens/PostRequestScreen';

// Type definitions
type RootStackParamList = {
    Main: undefined;
    Login: undefined;
    Register: undefined;
    NearbyWorkers: undefined;
    CreateService: undefined;
    MyServices: undefined;
    EditService: { serviceId: string };
    TransactionHistory: undefined;
    Settings: undefined;
    EditProfile: undefined;
    PostRequest: undefined;
};

type TabParamList = {
    Home: undefined;
    Chat: undefined;
    Wallet: undefined;
    Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
    const { user } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
                    let iconName: keyof typeof MaterialIcons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Chat') {
                        iconName = 'chat';
                    } else if (route.name === 'Profile') {
                        iconName = 'person';
                    } else if (route.name === 'Wallet') {
                        iconName = 'account-balance-wallet';
                    } else {
                        iconName = 'help';
                    }

                    return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: 'Trang chủ' }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{ title: 'Tin nhắn' }}
            />
            <Tab.Screen
                name="Wallet"
                component={WalletScreen}
                options={{ title: 'Ví' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Hồ sơ' }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        // You can add a loading screen here
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="Main" component={TabNavigator} />
                    <Stack.Screen name="NearbyWorkers" component={NearbyWorkersScreen} />
                    <Stack.Screen name="CreateService" component={CreateServiceScreen} />
                    <Stack.Screen name="MyServices" component={MyServicesScreen} />
                    <Stack.Screen name="EditService" component={EditServiceScreen} />
                    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="PostRequest" component={PostRequestScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
