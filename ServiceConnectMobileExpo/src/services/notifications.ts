// @ts-nocheck
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
    if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('Notification permissions denied');
            return false;
        }
        return true;
    } else {
        console.log('Must use physical device for notifications');
        return false;
    }
};

// Get push notification token
export const getNotificationToken = async () => {
    try {
        const token = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id', // Replace with your Expo project ID
        });
        console.log('Push token:', token);
        return token;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
};

// Send local notification
export const sendLocalNotification = async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data || {},
        },
        trigger: null, // Show immediately
    });
};

// Send push notification (server-side)
export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: token,
                title,
                body,
                data: data || {},
                priority: 'high',
                sound: 'default',
            }),
        });

        const result = await response.json();
        console.log('Push notification sent:', result);
        return result;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return null;
    }
};

// Listen for notifications
export const setupNotificationListeners = (onNotification: (notification: any) => void) => {
    Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        onNotification(notification);
    });

    Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // Handle notification tap
        const { data } = response.notification.request.content;

        // Navigate based on notification data
        if (data?.type === 'message') {
            // Navigate to chat screen
            // navigation.navigate('Chat', { chatId: data.chatId });
        } else if (data?.type === 'service') {
            // Navigate to service details
            // navigation.navigate('ServiceDetails', { serviceId: data.serviceId });
        }
    });
};

// Notification templates
export const notificationTemplates = {
    newMessage: (senderName: string, message: string) => ({
        title: 'Tin nhắn mới',
        body: `${senderName}: ${message}`,
        data: { type: 'message' },
    }),
    serviceRequest: (serviceName: string, customerName: string) => ({
        title: 'Yêu cầu dịch vụ mới',
        body: `${customerName} đã yêu cầu dịch vụ ${serviceName}`,
        data: { type: 'service' },
    }),
    serviceAccepted: (serviceName: string, providerName: string) => ({
        title: 'Dịch vụ được chấp nhận',
        body: `${providerName} đã chấp nhận yêu cầu dịch vụ ${serviceName}`,
        data: { type: 'service' },
    }),
    paymentReceived: (amount: number, serviceName: string) => ({
        title: 'Thanh toán thành công',
        body: `Bạn đã nhận được ${amount}đ cho dịch vụ ${serviceName}`,
        data: { type: 'payment' },
    }),
    serviceCompleted: (serviceName: string) => ({
        title: 'Dịch vụ hoàn thành',
        body: `Dịch vụ ${serviceName} đã được hoàn thành`,
        data: { type: 'service' },
    }),
};

export default {
    requestNotificationPermissions,
    getNotificationToken,
    sendLocalNotification,
    sendPushNotification,
    setupNotificationListeners,
    notificationTemplates,
};
