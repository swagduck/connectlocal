// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const MyServicesScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            // API call to get user's services (mobile endpoint)
            const response = await api.get(`/services/user/${user?.id}`);
            setServices(response.data.data);
        } catch (error) {
            console.error('Error loading services:', error);
            Alert.alert('Lỗi', 'Không thể tải dịch vụ của bạn');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadServices();
        setRefreshing(false);
    };

    const toggleAvailability = async (serviceId) => {
        try {
            // API call to toggle availability (mobile endpoint)
            await api.patch(`/services/${serviceId}/availability`);

            setServices(prev =>
                prev.map(service =>
                    service.id === serviceId
                        ? { ...service, availability: !service.availability }
                        : service
                )
            );

            Alert.alert(
                'Thành công',
                `Dịch vụ đã ${services.find(s => s.id === serviceId)?.availability ? 'ẩn' : 'hiện'}`
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái dịch vụ');
        }
    };

    const deleteService = (serviceId) => {
        Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn xóa dịch vụ này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // API call to delete service (mobile endpoint)
                            await api.delete(`/services/${serviceId}`);

                            setServices(prev => prev.filter(service => service.id !== serviceId));
                            Alert.alert('Thành công', 'Dịch vụ đã được xóa');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa dịch vụ');
                        }
                    },
                },
            ]
        );
    };

    const renderService = ({ item }) => (
        <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <Text style={styles.serviceCategory}>{item.category}</Text>
                    <Text style={styles.servicePrice}>{item.price}đ</Text>
                </View>
                <View style={styles.serviceActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => navigation.navigate('EditService', { serviceId: item.id })}
                    >
                        <MaterialIcons name="edit" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            item.availability ? styles.availableButton : styles.unavailableButton,
                        ]}
                        onPress={() => toggleAvailability(item.id)}
                    >
                        <MaterialIcons
                            name={item.availability ? 'visibility' : 'visibility-off'}
                            size={20}
                            color="white"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => deleteService(item.id)}
                    >
                        <MaterialIcons name="delete" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.serviceDescription}>{item.description}</Text>
            <Text style={styles.serviceLocation}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                {item.location}
            </Text>

            <View style={styles.serviceFooter}>
                <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>{item.rating}</Text>
                    <Text style={styles.reviews}>({item.reviews} đánh giá)</Text>
                </View>
                <Text style={styles.availability}>
                    <MaterialIcons
                        name={item.availability ? 'check-circle' : 'cancel'}
                        size={16}
                        color={item.availability ? '#4CAF50' : '#FF9800'}
                    />
                    {item.availability ? 'Đang có sẵn' : 'Tạm hết'}
                </Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dịch vụ của tôi</Text>
                <Text style={styles.headerSubtitle}>
                    {user?.role === 'provider' ? 'Quản lý các dịch vụ bạn cung cấp' : 'Bạn chưa có dịch vụ nào'}
                </Text>
            </View>

            {user?.role === 'provider' ? (
                <>
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{services.length}</Text>
                            <Text style={statLabel}>Tổng dịch vụ</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {services.filter(s => s.availability).length}
                            </Text>
                            <Text style={statLabel}>Đang hoạt động</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {services.reduce((sum, s) => sum + parseInt(s.price), 0)}
                            </Text>
                            <Text style={statLabel}>Tổng doanh thu</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('CreateService')}
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Đăng dịch vụ mới</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={services}
                        renderItem={renderService}
                        keyExtractor={item => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                    />
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="work" size={64} color="#ccc" />
                    <Text style={styles.emptyTitle}>Bạn chưa có dịch vụ nào</Text>
                    <Text style={styles.emptyDescription}>
                        Đăng ký làm thợ để bắt đầu cung cấp dịch vụ
                    </Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <MaterialIcons name="person-add" size={20} color="white" />
                        <Text style={styles.addButtonText}>Đăng ký làm thợ</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        margin: 20,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        margin: 20,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    listContainer: {
        padding: 20,
    },
    serviceCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    serviceInfo: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    serviceCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    serviceActions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#007AFF',
    },
    availableButton: {
        backgroundColor: '#4CAF50',
    },
    unavailableButton: {
        backgroundColor: '#FF9800',
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    serviceDescription: {
        fontSize: 14,
        color: '#666',
        marginVertical: 10,
    },
    serviceLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    serviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    reviews: {
        fontSize: 12,
        color: '#666',
        marginLeft: 10,
    },
    availability: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 12,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
    },
    emptyDescription: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default MyServicesScreen;
