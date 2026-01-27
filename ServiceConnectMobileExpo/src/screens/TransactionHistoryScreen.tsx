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
import api from '../services/api';

const TransactionHistoryScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, income, expense, pending

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            // API call to get all transactions
            const response = await api.get('/wallet/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error loading transactions:', error);
            Alert.alert('Lỗi', 'Không thể tải lịch sử giao dịch');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTransactions();
        setRefreshing(false);
    };

    const getFilteredTransactions = () => {
        if (!transactions || !Array.isArray(transactions)) {
            return [];
        }

        switch (filter) {
            case 'income':
                return transactions.filter(t => t.type === 'debit');
            case 'expense':
                return transactions.filter(t => t.type === 'credit');
            case 'pending':
                return transactions.filter(t => t.status === 'pending');
            default:
                return transactions;
        }
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
                <View style={styles.transactionIcon}>
                    <MaterialIcons
                        name={item.type === 'credit' ? 'arrow-upward' : 'arrow-downward'}
                        size={24}
                        color={item.type === 'credit' ? '#F44336' : '#4CAF50'}
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{item.description}</Text>
                    <Text style={styles.transactionDate}>
                        {new Date(item.date).toLocaleDateString('vi-VN')} {new Date(item.date).toLocaleTimeString('vi-VN')}
                    </Text>
                    <View style={styles.categoryContainer}>
                        <MaterialIcons name="label" size={14} color="#666" />
                        <Text style={styles.categoryText}>{getCategoryName(item.category)}</Text>
                    </View>
                </View>
                <View style={styles.transactionAmount}>
                    <Text style={[
                        styles.amount,
                        item.type === 'credit' ? styles.credit : styles.debit,
                    ]}>
                        {item.type === 'credit' ? '-' : '+'}{item.amount.toLocaleString()}đ
                    </Text>
                    <View style={styles.statusContainer}>
                        <MaterialIcons
                            name={item.status === 'completed' ? 'check-circle' : 'schedule'}
                            size={16}
                            color={item.status === 'completed' ? '#4CAF50' : '#FF9800'}
                        />
                        <Text style={[
                            styles.statusText,
                            item.status === 'completed' ? styles.completed : styles.pending,
                        ]}>
                            {item.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                        </Text>
                    </View>
                </View>
            </View>

            {item.serviceName && (
                <View style={styles.serviceInfo}>
                    <MaterialIcons name="work" size={16} color="#666" />
                    <Text style={styles.serviceName}>{item.serviceName}</Text>
                </View>
            )}
        </View>
    );

    const getCategoryName = (category) => {
        const categories = {
            electric: 'Điện',
            plumbing: 'Nước',
            painting: 'Sơn',
            cleaning: 'Vệ sinh',
            deposit: 'Nạp tiền',
            withdrawal: 'Rút tiền',
            refund: 'Hoàn tiền',
        };
        return categories[category] || 'Khác';
    };

    const getStats = () => {
        const filtered = getFilteredTransactions();
        return {
            totalIncome: filtered && Array.isArray(filtered)
                ? filtered
                    .filter(t => t.type === 'debit' && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                : 0,
            totalExpense: filtered && Array.isArray(filtered)
                ? filtered
                    .filter(t => t.type === 'credit' && t.status === 'completed')
                    .reduce((sum, t) => sum + t.amount, 0)
                : 0,
            pendingTransactions: filtered && Array.isArray(filtered)
                ? filtered.filter(t => t.status === 'pending').length
                : 0,
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
            </View>
        );
    }

    const stats = getStats();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalIncome.toLocaleString()}đ</Text>
                    <Text style={styles.statLabel}>Tổng thu</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalExpense.toLocaleString()}đ</Text>
                    <Text style={styles.statLabel}>Tổng chi</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.pendingTransactions}</Text>
                    <Text style={styles.statLabel}>Đang chờ</Text>
                </View>
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={styles.filterText}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'income' && styles.activeFilter]}
                    onPress={() => setFilter('income')}
                >
                    <Text style={styles.filterText}>Thu nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'expense' && styles.activeFilter]}
                    onPress={() => setFilter('expense')}
                >
                    <Text style={styles.filterText}>Chi tiêu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={styles.filterText}>Đang chờ</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={getFilteredTransactions()}
                renderItem={renderTransaction}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
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
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    filterButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    activeFilter: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterText: {
        fontSize: 14,
        color: '#333',
    },
    listContainer: {
        padding: 20,
    },
    transactionCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    transactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    credit: {
        color: '#F44336',
    },
    debit: {
        color: '#4CAF50',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        marginLeft: 5,
    },
    completed: {
        color: '#4CAF50',
    },
    pending: {
        color: '#FF9800',
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    serviceName: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
});

export default TransactionHistoryScreen;
