// @ts-nocheck
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import * as ImagePicker from 'react-native-image-picker';
import Toast from 'react-native-toast-notifications';

const CreateServiceScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'electric',
        price: '',
        location: '',
        availability: true,
        images: [],
    });

    const categories = [
        { id: 'electric', name: 'Điện', icon: 'electrical-services' },
        { id: 'plumbing', name: 'Nước', icon: 'plumbing' },
        { id: 'painting', name: 'Sơn', icon: 'format-paint' },
        { id: 'cleaning', name: 'Vệ sinh', icon: 'cleaning-services' },
        { id: 'garden', name: 'Làm vườn', icon: 'yard' },
        { id: 'other', name: 'Khác', icon: 'more-horiz' },
    ];

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibrary({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, result.assets[0].uri],
                }));
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCamera({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, result.assets[0].uri],
                }));
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chụp ảnh');
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description || !formData.price) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        setLoading(true);
        try {
            // API call to create service
            const response = await api.post('/services', formData);
            // console.log(response.data); // Uncomment this line to log the response data
            Alert.alert('Thành công', 'Dịch vụ đã được đăng thành công!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đăng dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đăng dịch vụ</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Tiêu đề dịch vụ</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.title}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                        placeholder="Nhập tiêu đề dịch vụ"
                    />

                    <Text style={styles.label}>Mô tả</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                        placeholder="Mô tả chi tiết về dịch vụ của bạn"
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Danh mục</Text>
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

                    <Text style={styles.label}>Giá (VNĐ)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.price}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                        placeholder="Nhập giá dịch vụ"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Địa chỉ</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.location}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                        placeholder="Nhập địa chỉ cung cấp dịch vụ"
                    />

                    <Text style={styles.label}>Hình ảnh dịch vụ</Text>
                    <View style={styles.imageContainer}>
                        {formData.images.map((image, index) => (
                            <View key={index} style={styles.imageItem}>
                                <Image source={{ uri: image }} style={styles.image} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <MaterialIcons name="close" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                            <MaterialIcons name="photo-library" size={24} color="#007AFF" />
                            <Text style={styles.addImageText}>Chọn ảnh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                            <MaterialIcons name="camera-alt" size={24} color="#007AFF" />
                            <Text style={styles.addImageText}>Chụp ảnh</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Đang đăng...' : 'Đăng dịch vụ'}
                        </Text>
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
    imageContainer: {
        marginBottom: 20,
    },
    imageItem: {
        position: 'relative',
        marginRight: 10,
        marginBottom: 10,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
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

export default CreateServiceScreen;
