// @ts-nocheck
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const PostRequestScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'electric',
        budget: '',
        location: '',
        urgency: 'normal',
        images: [],
        contactInfo: {
            phone: '',
            email: '',
        },
    });

    const categories = [
        { id: 'electric', name: 'Điện', icon: 'electrical-services' },
        { id: 'plumbing', name: 'Nước', icon: 'plumbing' },
        { id: 'painting', name: 'Sơn', icon: 'format-paint' },
        { id: 'cleaning', name: 'Vệ sinh', icon: 'cleaning-services' },
        { id: 'garden', name: 'Làm vườn', icon: 'yard' },
        { id: 'other', name: 'Khác', icon: 'more-horiz' },
    ];

    const urgencyLevels = [
        { id: 'low', name: 'Thấp', color: '#4CAF50' },
        { id: 'normal', name: 'Bình thường', color: '#FF9800' },
        { id: 'high', name: 'Khẩn', color: '#F44336' },
    ];

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.budget) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);
        try {
            // API call to post service request
            const response = await api.post('/requests', {
                ...formData,
                user: user?.id,
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Thành công', 'Yêu cầu dịch vụ đã được đăng!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đăng yêu cầu dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    const renderServiceItem = ({ item }) => (
        <TouchableOpacity style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
                <MaterialIcons name={item.icon} size={24} color="#007AFF" />
            </View>
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDescription}>{item.description}</Text>
            </View>
            <MaterialIcons
                name={formData.category === item.id ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={formData.category === item.id ? '#007AFF' : '#ccc'}
            />
        </TouchableOpacity>
    );

    const renderUrgencyItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.urgencyItem,
                formData.urgency === item.id && styles.selectedUrgency,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, urgency: item.id }))}
        >
            <View
                style={[
                    styles.urgencyDot,
                    { backgroundColor: item.color },
                ]}
            />
            <Text style={styles.urgencyText}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đăng yêu cầu dịch vụ</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Tiêu đề yêu cầu</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.title}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                        placeholder="Mô tả yêu cầu của bạn"
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>Mô tả chi tiết</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                        placeholder="Mô tả chi tiết về yêu cầu dịch vụ"
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Danh mục dịch vụ</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryItem,
                                    formData.category === category.id && styles.selectedCategory,
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, category: category.id }))}
                            >
                                <MaterialIcons name={category.icon} size={20} color={formData.category === category.id ? '#007AFF' : '#666'} />
                                <Text style={styles.categoryText}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Ngân sách dự kiến</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.budget}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, budget: text }))}
                        placeholder="Nhập ngân sách dự kiến"
                        keyboardType="numeric"
                    />

                    <Text style={label}>Địa chỉ</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                        placeholder="Nhập địa chỉ cần dịch vụ"
                    />

                    <Text style={styles.label}>Mức độ khẩn</Text>
                    <View style={styles.urgencyContainer}>
                        {urgencyLevels.map((urgency) => (
                            renderUrgencyItem({ key: urgency.id, item: urgency })
                        ))}
                    </View>

                    <Text style={styles.label}>Thông tin liên hệ</Text>
                    <View style={styles.contactContainer}>
                        <View style={styles.contactItem}>
                            <MaterialIcons name="phone" size={20} color="#666" />
                            <TextInput
                                style={styles.contactInput}
                                value={formData.contactInfo.phone}
                                onChangeText={(text) => setFormData(prev => ({
                                    ...prev,
                                    contactInfo: { ...prev.contactInfo, phone: text }
                                }))}
                                placeholder="Số điện thoại"
                                keyboardType="phone"
                            />
                        </View>
                        <View style={styles.contactItem}>
                            <MaterialIcons name="email" size={20} color="#666" />
                            <TextInput
                                style={styles.contactInput}
                                value={formData.contactInfo.email}
                                onChangeText={(text) => setFormData(prev => ({
                                    ...prev,
                                    contactInfo: { ...prev.contactInfo, email: text }
                                }))}
                                placeholder="Email"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Hình ảnh (nếu có)</Text>
                    <View style={styles.imageContainer}>
                        <TouchableOpacity style={styles.addImageButton}>
                            <MaterialIcons name="add" size={24} color="#007AFF" />
                            <Text style={styles.addImageText}>Thêm hình ảnh</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Đăng yêu cầu</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 20,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginRight: 10,
        marginBottom: 10,
    },
    selectedCategory: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    categoryText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    urgencyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    urgencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    selectedUrgency: {
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    urgencyDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    urgencyText: {
        fontSize: 14,
        color: '#333',
    },
    contactContainer: {
        marginBottom: 15,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    contactInput: {
        flex: 1,
        fontSize: 16,
        marginLeft: 10,
    },
    imageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    addImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    addImageText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007AFF',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PostRequestScreen;
