import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getTransactions, deleteTransaction } from '../services/transactions';
import { getCategories } from '../services/categories';
import Card from '../components/Card';
import { Colors, Spacing } from '../components/Theme';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function SourcesDetails({ route, navigation }) {
  const { sourceId, sourceName } = route.params;

  const [transactions, setTransactions] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
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
      const [txData, catData] = await Promise.all([
        getTransactions(100, sourceId),
        getCategories(true)
      ]);
      
      const cmap = {};
      catData.forEach(c => { cmap[c.id] = c; });
      setCategoriesMap(cmap);
      setTransactions(txData);
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
            await deleteTransaction(id);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const totalBalance = transactions.reduce((sum, tx) => {
    return tx.type === 'expense' ? sum - tx.amount : sum + tx.amount;
  }, 0);

  const renderItem = ({ item }) => {
    const isExpense = item.type === 'expense';
    const category = categoriesMap[item.category_id] || {};

    return (
      <Card style={styles.txCard}>
        <View style={styles.txContent}>
          <View style={[styles.iconContainer, { backgroundColor: (category.color || '#eee') + '15' }]}>
            <MaterialCommunityIcons 
              name={category.icon || 'tag'} 
              size={22} 
              color={category.color || Colors.muted} 
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.notes || category.name || 'Untitled'}
            </Text>
            <Text style={styles.date}>
              {formatDate(item.date)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[
              styles.amount,
              { color: isExpense ? '#e53935' : '#2e7d32' }
            ]}>
              {isExpense ? '-' : '+'} ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                <Feather name="edit-2" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                <Feather name="trash-2" size={14} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Available Balance</Text>
        <Text style={styles.heroAmount}>
          ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
      </View>

      {loading ? (
        <View style={styles.center}><Text>Loading...</Text></View>
      ) : transactions.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={Colors.muted} />
          <Text style={{ marginTop: 12, color: Colors.muted }}>No transactions found</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.m,
  },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  headerRow: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  txCard: {
    marginBottom: 12,
    padding: 0,
    borderRadius: 16,
  },
  txContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  date: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionBtn: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});