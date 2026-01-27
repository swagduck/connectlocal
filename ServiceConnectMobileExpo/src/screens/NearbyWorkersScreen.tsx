// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';

const NearbyWorkersScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [workers, setWorkers] = useState([]);

    useEffect(() => {
        loadWorkers();
    }, []);

    const loadWorkers = async () => {
        try {
            // API call to get nearby workers
            const response = await api.get('/workers/nearby');
            setWorkers(response.data);
        } catch (error) {
            console.error('Error loading workers:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thợ');
        } finally {
            setLoading(false);
        }
    };

    const renderWorker = ({ item }) => (
        <TouchableOpacity style={styles.workerCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.profession}>{item.profession}</Text>
                <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>{item.rating}</Text>
                </View>
                <View style={styles.distanceContainer}>
                    <MaterialIcons name="location-on" size={16} color="#007AFF" />
                    <Text style={styles.distance}>{item.distance}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.contactButton}>
                <MaterialIcons name="phone" size={20} color="white" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải thợ gần bạn...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thợ gần bạn</Text>
                <Text style={styles.headerSubtitle}>Tìm thợ chuyên nghiệp gần khu vực của bạn</Text>
            </View>

            <FlatList
                data={workers}
                renderItem={renderWorker}
                keyExtractor={item => item.id.toString()}
                style={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    list: {
        flex: 1,
        padding: 20,
    },
    workerCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    workerInfo: {
        flex: 1,
    },
    workerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    profession: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    rating: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distance: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 5,
    },
    contactButton: {
        backgroundColor: '#4CAF50',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default NearbyWorkersScreen;
