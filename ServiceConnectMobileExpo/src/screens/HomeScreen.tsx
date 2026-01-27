import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../hooks/useAuth';

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();

    const services = [
        { id: 1, name: 'Điện nước', icon: 'plumbing', color: '#2196F3' },
        { id: 2, name: 'Sửa chữa', icon: 'build', color: '#FF9800' },
        { id: 3, name: 'Vệ sinh', icon: 'cleaning-services', color: '#4CAF50' },
        { id: 4, name: 'Sơn nhà', icon: 'format-paint', color: '#9C27B0' },
        { id: 5, name: 'Garden', icon: 'yard', color: '#8BC34A' },
        { id: 6, name: 'Khác', icon: 'more-horiz', color: '#607D8B' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeText}>
                    Xin chào, {user?.name || 'Người dùng'}!
                </Text>
                <Text style={styles.subtitleText}>
                    Bạn cần dịch vụ gì hôm nay?
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
                <View style={styles.servicesGrid}>
                    {services.map(service => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => {
                                // Navigate to service details
                            }}>
                            <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
                                <Icon name={service.icon} size={30} color="white" />
                            </View>
                            <Text style={styles.serviceName}>{service.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nhanh chóng</Text>
                <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.navigate('PostRequest')}>
                    <Icon name="add-circle" size={24} color="#007AFF" />
                    <Text style={styles.quickActionText}>Đăng yêu cầu mới</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.navigate('NearbyWorkers')}>
                    <Icon name="location-on" size={24} color="#007AFF" />
                    <Text style={styles.quickActionText}>Tìm thợ gần đây</Text>
                </TouchableOpacity>
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
        padding: 20,
        paddingTop: 60,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    serviceCard: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 12,
        textAlign: 'center',
        color: '#333',
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    quickActionText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
});

export default HomeScreen;
