// @ts-nocheck
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

const SettingsScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [autoPlayVideos, setAutoPlayVideos] = useState(true);
    const [dataUsage, setDataUsage] = useState('wifi');

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const toggleNotifications = async (value) => {
        setNotificationsEnabled(value);
        if (value) {
            try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Thông báo', 'Quyền thông báo bị từ chối');
                    setNotificationsEnabled(false);
                }
            } catch (error) {
                console.error('Error requesting notification permissions:', error);
                setNotificationsEnabled(false);
            }
        }
    };

    const toggleLocation = async (value) => {
        setLocationEnabled(value);
        if (value) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Vị trí', 'Quyền truy cập vị trí bị từ chối');
                    setLocationEnabled(false);
                }
            } catch (error) {
                console.error('Error requesting location permissions:', error);
                setLocationEnabled(false);
            }
        }
    };

    const openPrivacyPolicy = () => {
        Linking.openURL('https://example.com/privacy-policy');
    };

    const openTermsOfService = () => {
        Linking.openURL('https://example.com/terms-of-service');
    };

    const openSupport = () => {
        Alert.alert('Hỗ trợ', 'Chọn cách hỗ trợ:', [
            { text: 'Email', onPress: () => Linking.openURL('mailto:support@serviceconnect.com') },
            { text: 'Điện thoại', onPress: () => Linking.openURL('tel:19001234') },
            { text: 'Hủy', style: 'cancel' },
        ]);
    };

    const clearCache = () => {
        Alert.alert(
            'Xóa cache',
            'Xóa tất cả dữ liệu cache sẽ giúp ứng dụng chạy nhanh hơn nhưng bạn sẽ cần đăng nhập lại.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        // Implement cache clearing logic
                        Alert.alert('Thành công', 'Đã xóa cache thành công');
                    },
                },
            ]
        );
    };

    const aboutApp = () => {
        Alert.alert(
            'Về ứng dụng',
            'ServiceConnect Mobile\n\nPhiên bản: 1.0.0\n\nỨng dụng kết nối người dùng với các dịch vụ chuyên nghiệp.',
            [{ text: 'OK' }]
        );
    };

    const renderSettingItem = (icon, title, subtitle, value, onPress, showArrow = false) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingLeft}>
                <MaterialIcons name={icon} size={24} color="#007AFF" />
                <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={styles.settingRight}>
                {value !== undefined && (
                    <Switch
                        value={value}
                        onValueChange={onPress}
                        trackColor="#007AFF"
                        thumbColor="#fff"
                    />
                )}
                {showArrow && <MaterialIcons name="chevron-right" size={24} color="#ccc" />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cài đặt</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông báo</Text>
                    {renderSettingItem(
                        'notifications',
                        'Thông báo đẩy',
                        'Nhận thông báo về tin nhắn và cập nhật dịch vụ',
                        notificationsEnabled,
                        toggleNotifications
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vị trí</Text>
                    {renderSettingItem(
                        'location',
                        'Dịch vụ vị trí',
                        'Cho phép ứng dụng truy cập vị trí của bạn',
                        locationEnabled,
                        toggleLocation
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hiển thị</Text>
                    {renderSettingItem(
                        'dark-mode',
                        'Chế độ tối',
                        'Sử dụng giao diện tối',
                        darkMode,
                        setDarkMode
                    )}
                    {renderSettingItem(
                        'video-autoplay',
                        'Tự động phát video',
                        'Tự động phát video trong tin nhắn',
                        autoPlayVideos,
                        setAutoPlayVideos
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dữ liệu</Text>
                    {renderSettingItem(
                        'data-usage',
                        'Sử dụng dữ liệu',
                        'Chỉ sử dụng WiFi',
                        null,
                        () => {
                            Alert.alert(
                                'Sử dụng dữ liệu',
                                'Chọn cách sử dụng dữ liệu:',
                                [
                                    { text: 'Chỉ WiFi', onPress: () => setDataUsage('wifi') },
                                    { text: 'WiFi và di động', onPress: () => setDataUsage('wifi-mobile') },
                                    { text: 'Luôn luôn', onPress: () => setDataUsage('always') },
                                    { text: 'Hủy', style: 'cancel' },
                                ]
                            );
                        }
                    )}
                    {renderSettingItem(
                        'delete-cache',
                        'Xóa cache',
                        'Giải phóng bộ nhớ cache',
                        null,
                        clearCache
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tài khoản</Text>
                    {renderSettingItem(
                        'person',
                        'Thông tin cá nhân',
                        'Chỉnh sửa thông tin cá nhân',
                        null,
                        () => navigation.navigate('EditProfile'),
                        true
                    )}
                    {renderSettingItem(
                        'security',
                        'Bảo mật',
                        'Thay đổi mật khẩu và cài đặt bảo mật',
                        null,
                        () => navigation.navigate('EditProfile'),
                        true
                    )}
                    {renderSettingItem(
                        'logout',
                        'Đăng xuất',
                        'Đăng xuất khỏi tài khoản',
                        null,
                        handleLogout
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hỗ trợ</Text>
                    {renderSettingItem(
                        'help',
                        'Trung tâm hỗ trợ',
                        'Tìm câu trả lời và liên hệ hỗ trợ',
                        null,
                        openSupport,
                        true
                    )}
                    {renderSettingItem(
                        'info',
                        'Về ứng dụng',
                        'Phiên bản và thông tin',
                        null,
                        aboutApp,
                        true
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pháp lý</Text>
                    {renderSettingItem(
                        'description',
                        'Điều khoản dịch vụ',
                        'Đọc điều khoản sử dụng dịch vụ',
                        null,
                        openTermsOfService,
                        true
                    )}
                    {renderSettingItem(
                        'privacy',
                        'Chính sách bảo mật',
                        'Tìm hiểu cách chúng tôi bảo vệ dữ liệu của bạn',
                        null,
                        openPrivacyPolicy,
                        true
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Phiên bản 1.0.0</Text>
                    <Text style={styles.footerText}>© 2024 ServiceConnect</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        marginBottom: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
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
    settingRight: {
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
    },
});

export default SettingsScreen;
