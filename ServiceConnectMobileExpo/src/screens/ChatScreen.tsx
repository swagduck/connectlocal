import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({ navigation }: any) => {
    const conversations = [
        {
            id: 1,
            name: 'Nguyễn Văn A',
            lastMessage: 'Cảm ơn bạn đã giúp đỡ',
            time: '10:30',
            unread: 2,
            avatar: 'https://via.placeholder.com/50',
        },
        {
            id: 2,
            name: 'Trần Thị B',
            lastMessage: 'Khi nào bạn có thể đến?',
            time: 'Hôm qua',
            unread: 0,
            avatar: 'https://via.placeholder.com/50',
        },
    ];

    const renderConversation = ({ item }: any) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => navigation.navigate('ChatDetail', { userId: item.id })}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>

            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                </Text>
            </View>

            {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Icon name="search" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderConversation}
                keyExtractor={item => item.id.toString()}
                style={styles.conversationsList}
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchButton: {
        padding: 5,
    },
    conversationsList: {
        flex: 1,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    time: {
        fontSize: 12,
        color: '#666',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
    },
    unreadBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    unreadText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default ChatScreen;
