import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', onPress: logout },
            ]
        );
    };

    const menuItems = [
        {
            id: 1,
            title: 'Thông tin cá nhân',
            icon: 'person',
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            id: 2,
            title: 'Lịch sử giao dịch',
            icon: 'history',
            onPress: () => navigation.navigate('TransactionHistory'),
        },
        {
            id: 3,
            title: 'Cài đặt',
            icon: 'settings',
            onPress: () => navigation.navigate('Settings'),
        },
        {
            id: 4,
            title: 'Trợ giúp',
            icon: 'help',
            onPress: () => navigation.navigate('Help'),
        },
        {
            id: 5,
            title: 'Đăng xuất',
            icon: 'logout',
            onPress: handleLogout,
            color: '#FF3B30',
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
                <Text style={styles.userRole}>
                    {user?.role === 'admin' ? 'Quản trị viên' :
                        user?.role === 'provider' ? 'Thợ' : 'Khách hàng'}
                </Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                        {user?.walletBalance?.toLocaleString() || 0}
                    </Text>
                    <Text style={styles.statLabel}>Số dư (đ)</Text>
                </View>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={item.onPress}>
                        <View style={styles.menuItemLeft}>
                            <Icon
                                name={item.icon}
                                size={24}
                                color={item.color || '#007AFF'}
                            />
                            <Text style={[styles.menuItemText, item.color && { color: item.color }]}>
                                {item.title}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#ccc" />
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#007AFF',
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    userName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        marginBottom: 5,
    },
    userRole: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
    statsContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    menuContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
});

export default ProfileScreen;
