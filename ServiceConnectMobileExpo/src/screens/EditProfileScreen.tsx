// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import * as ImagePicker from 'react-native-image-picker';
import Toast from 'react-native-toast-notifications';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        bio: '',
        avatar: '',
    });
    const [avatarSource, setAvatarSource] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                bio: user.bio || '',
                avatar: user.avatar || '',
            });
            if (user.avatar) {
                setAvatarSource({ uri: user.avatar });
            }
        }
    }, [user]);

    const pickImage = async () => {
        try {
            Alert.alert(
                'Chọn ảnh đại diện',
                'Chọn nguồn ảnh:',
                [
                    { text: 'Thư viện', onPress: () => pickFromLibrary() },
                    { text: 'Máy ảnh', onPress: () => takePhoto() },
                    { text: 'Hủy', style: 'cancel' },
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const pickFromLibrary = async () => {
        try {
            const result = await ImagePicker.launchImageLibrary({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarSource({ uri: result.assets[0].uri });
                setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCamera({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setAvatarSource({ uri: result.assets[0].uri });
                setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chụp ảnh');
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setLoading(true);
        try {
            // API call to update profile
            await api.put('/auth/updatedetails', formData);
            await updateUser(formData);
            Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Xóa tài khoản',
            'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // API call to delete account
                            await api.delete('/auth/delete');
                            Alert.alert(
                                'Đã xóa',
                                'Tài khoản của bạn đã được xóa thành công.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            logout();
                                            navigation.navigate('Login');
                                        },
                                    },
                                ]
                            );
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa tài khoản');
                        }
                    },
                },
            ]
        );
    };

    const logout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            navigation.navigate('Login');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể đăng xuất');
                        }
                    },
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.avatarSection}>
                        <Text style={styles.sectionTitle}>Ảnh đại diện</Text>
                        <View style={styles.avatarContainer}>
                            {avatarSource ? (
                                <Image source={avatarSource} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <MaterialIcons name="person" size={48} color="#ccc" />
                                </View>
                            )}
                            <TouchableOpacity style={styles.changeAvatarButton} onPress={pickImage}>
                                <MaterialIcons name="camera-alt" size={20} color="white" />
                                <Text style={styles.changeAvatarText}>Thay đổi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Họ và tên</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                placeholder="Nhập họ và tên"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={formData.email}
                                editable={false}
                                placeholder="Email"
                            />
                            <Text style={styles.note}>Email không thể thay đổi</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Số điện thoại</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.phone}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                                placeholder="Nhập số điện thoại"
                                keyboardType="phone"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Địa chỉ</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.address}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                placeholder="Nhập địa chỉ"
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Giới thiệu</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                placeholder="Giới thiệu ngắn về bản thân"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Bảo mật</Text>

                        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword')}>
                            <MaterialIcons name="lock" size={24} color="#007AFF" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Đổi mật khẩu</Text>
                                <Text style={styles.settingSubtitle}>Cập nhật mật khẩu của bạn</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('TwoFactorAuth')}>
                            <MaterialIcons name="security" size={24} color="#007AFF" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Xác thực hai yếu tố</Text>
                                <Text style={styles.settingSubtitle}>Thêm lớp bảo mật cho tài khoản</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Nguy hiểm</Text>

                        <TouchableOpacity style={[styles.dangerButton, styles.deleteButton]} onPress={handleDeleteAccount}>
                            <MaterialIcons name="delete" size={20} color="white" />
                            <Text style={styles.dangerButtonText}>Xóa tài khoản</Text>
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
                            <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
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
    content: {
        padding: 20,
    },
    avatarSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    changeAvatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    changeAvatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    formSection: {
        marginBottom: 30,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#999',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    note: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    settingText: {
        flex: 1,
        marginLeft: 15,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    settingSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    deleteButton: {
        backgroundColor: '#F44336',
    },
    dangerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
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

export default EditProfileScreen;
