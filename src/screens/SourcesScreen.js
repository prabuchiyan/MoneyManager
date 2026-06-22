import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { getSources, deleteSource } from '../services/sources';
import { getTransactions } from '../services/transactions';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { Colors, Spacing } from '../components/Theme';
import SourceCreateModal from '../components/SourceCreateModal';
import { Searchbar } from 'react-native-paper';

export default function SourcesScreen() {

  const [items, setItems] = useState([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editSource, setEditSource] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    const sources = await getSources(true);
    const transactions = await getTransactions(1000000);

    const balanceMap = transactions.reduce((acc, txn) => {
      const amt = Number(txn.amount || 0);
      const sourceId = txn.source_id || txn.sourceId;
      if (!sourceId) return acc;
      if (!acc[sourceId]) acc[sourceId] = 0;
      if (txn.type === 'income' || txn.type === 'credit') {
        acc[sourceId] += amt;
      } else if (txn.type === 'expense' || txn.type === 'debit') {
        acc[sourceId] -= amt;
      }
      return acc;
    }, {});

    const updated = sources.map(s => {
      const id = s.id;
      const balance =
        Number(s.initial_balance || 0) +
        Number(balanceMap[id] || 0);
      return {
        ...s,
        balance
      };
    });
    setItems(updated);
  }

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.name || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  async function remove(id) {
    await deleteSource(id);
    load();
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: Spacing.m, paddingBottom: 0 }}>
        <Searchbar
          placeholder="Search source..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }}
          inputStyle={{ fontSize: 14 }}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: Spacing.m }}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>

              <View style={[styles.iconBox, { backgroundColor: (item.color || Colors.primary) + '15' }]}>
                <MaterialCommunityIcons
                  name={item.icon || 'cash'}
                  size={22}
                  color={item.color || Colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>

                <Text style={styles.amount}>
                  ₹{Number(item.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditSource(item);
                    setShowModal(true);
                  }}
                  style={styles.actionBtn}
                >
                  <Feather name="edit-2" size={16} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setConfirmTargetId(item.id);
                    setConfirmVisible(true);
                  }}
                  style={styles.actionBtn}
                >
                  <Feather name="trash-2" size={16} color="#e53935" />
                </TouchableOpacity>
              </View>

            </View>
          </Card>
        )}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete Source"
        message="Are you sure?"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => {
          await remove(confirmTargetId);
          setConfirmVisible(false);
        }}
      />

      {/* Create/Edit Modal */}
      <SourceCreateModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        editData={editSource}
        onSave={() => {
          setShowModal(false);
          load(); // ✅ refresh with new balance
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditSource(null);
          setShowModal(true);
        }}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  amount: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
    fontWeight: '600',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B7CF3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});