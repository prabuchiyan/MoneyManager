import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { getTransactions } from '../services/transactions';
import { executeSql } from '../database/db';

export default function SourcesDetails({ route, navigation }) {
  const { sourceId, sourceName } = route.params;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: sourceName
    });
  }, [sourceName]);

  useEffect(() => {
    loadTransactions();
  }, [sourceId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions(100, sourceId);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete with confirmation
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await executeSql(
              `DELETE FROM transactions WHERE id = ?`,
              [id]
            );
            loadTransactions();
          }
        }
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate('TransactionAdd', {
      isEdit: true,
      transaction: item
    });
  };

  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';

    return (
      <View style={styles.card}>

        {/* Left */}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {item.notes || 'No note'}
          </Text>

          <Text style={styles.date}>
            {item.date || 'No date'}
          </Text>
        </View>

        {/* Right */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[
            styles.amount,
            { color: isExpense ? '#e53935' : '#2e7d32' }
          ]}>
            {isExpense ? '-' : '+'} ₹{Number(item.amount).toFixed(2)}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Text style={styles.edit} onPress={() => handleEdit(item)}>
              Edit
            </Text>

            <Text style={styles.delete} onPress={() => handleDelete(item.id)}>
              Delete
            </Text>
          </View>
        </View>

      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>

      {/* Header */}
      <Text style={styles.header}>{sourceName}</Text>

      {/* Content */}
      {loading ? (
        <Text>Loading...</Text>
      ) : transactions.length === 0 ? (
        <Text>No transactions found</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12
  },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,

    borderWidth: 1,
    borderColor: '#eee',

    elevation: 2
  },

  title: {
    fontSize: 15,
    fontWeight: '600'
  },

  date: {
    fontSize: 12,
    color: '#777',
    marginTop: 4
  },

  amount: {
    fontSize: 16,
    fontWeight: '700'
  },

  actions: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 10
  },

  edit: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500'
  },

  delete: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500'
  }
});