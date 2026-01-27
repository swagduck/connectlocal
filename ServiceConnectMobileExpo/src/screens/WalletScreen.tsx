// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const WalletScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddMoney, setShowAddMoney] = useState(false);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        try {
            // API call to get wallet transactions
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
        await refreshUser();
        setRefreshing(false);
    };

    const handleAddMoney = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
            return;
        }

        try {
            // API call to add money to wallet
            await api.post('/wallet/add', { amount: parseFloat(amount) });

            Alert.alert('Thành công', `Đã nạp ${amount}đ vào ví`, [
                {
                    text: 'OK', onPress: () => {
                        setShowAddMoney(false);
                        setAmount('');
                        onRefresh();
                    }
                },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể nạp tiền vào ví');
        }
    };

    const handleWithdrawMoney = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
            return;
        }

        if (parseFloat(amount) > (user?.walletBalance || 0)) {
            Alert.alert('Lỗi', 'Số dư không đủ');
            return;
        }

        try {
            // API call to withdraw money from wallet
            await api.post('/wallet/withdraw', { amount: parseFloat(amount) });

            Alert.alert('Thành công', `Yêu cầu rút ${amount}đ đã được gửi`, [
                {
                    text: 'OK', onPress: () => {
                        setShowAddMoney(false);
                        setAmount('');
                        onRefresh();
                    }
                },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể rút tiền');
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
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                    </Text>
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

    const stats = {
        totalIncome: transactions && Array.isArray(transactions)
            ? transactions
                .filter(t => t.type === 'debit' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
            : 0,
        totalExpense: transactions && Array.isArray(transactions)
            ? transactions
                .filter(t => t.type === 'credit' && t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
            : 0,
        pendingTransactions: transactions && Array.isArray(transactions)
            ? transactions.filter(t => t.status === 'pending').length
            : 0,
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải ví...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ví của tôi</Text>
                <Text style={styles.headerSubtitle}>Quản lý tài chính của bạn</Text>
            </View>

            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                    <TouchableOpacity onPress={onRefresh}>
                        <MaterialIcons name="refresh" size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.balanceAmount}>
                    {(user?.walletBalance || 0).toLocaleString()}đ
                </Text>

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
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={() => setShowAddMoney(true)}
                >
                    <MaterialIcons name="add" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Nạp tiền</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.withdrawButton]}
                    onPress={() => setShowAddMoney(true)}
                >
                    <MaterialIcons name="remove" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Rút tiền</Text>
                </TouchableOpacity>
            </View>

            {showAddMoney && (
                <View style={styles.addMoneyContainer}>
                    <Text style={styles.addMoneyTitle}>Nạp/Rút tiền</Text>
                    <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="Nhập số tiền"
                        keyboardType="numeric"
                    />
                    <View style={styles.addMoneyButtons}>
                        <TouchableOpacity
                            style={[styles.addMoneyButton, styles.confirmButton]}
                            onPress={handleAddMoney}
                        >
                            <Text style={styles.addMoneyButtonText}>Nạp tiền</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addMoneyButton, styles.withdrawMoneyButton]}
                            onPress={handleWithdrawMoney}
                        >
                            <Text style={styles.addMoneyButtonText}>Rút tiền</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addMoneyButton, styles.cancelButton]}
                            onPress={() => {
                                setShowAddMoney(false);
                                setAmount('');
                            }}
                        >
                            <Text style={styles.addMoneyButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Lịch sử giao dịch</Text>
                <Text style={styles.transactionsCount}>
                    {transactions && Array.isArray(transactions) ? transactions.length : 0} giao dịch
                </Text>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                style={styles.transactionsList}
            >
                {transactions && Array.isArray(transactions) ? transactions.map((transaction) => (
                    <View key={transaction.id}>
                        {renderTransaction({ item: transaction })}
                    </View>
                )) : (
                    <View style={styles.emptyTransactions}>
                        <MaterialIcons name="receipt" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
                    </View>
                )}
            </ScrollView>
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
    balanceCard: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#666',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        margin: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 120,
        justifyContent: 'center',
    },
    addButton: {
        backgroundColor: '#4CAF50',
    },
    withdrawButton: {
        backgroundColor: '#FF9800',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    addMoneyContainer: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addMoneyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    amountInput: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    addMoneyButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    addMoneyButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
    },
    withdrawMoneyButton: {
        backgroundColor: '#FF9800',
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    addMoneyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    transactionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    transactionsCount: {
        fontSize: 14,
        color: '#666',
    },
    transactionsList: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    transactionCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginVertical: 5,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
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
        marginBottom: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
    },
    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
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
        borderTopColor: '#f5f5f5',
    },
    serviceName: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    emptyTransactions: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
});

export default WalletScreen;
