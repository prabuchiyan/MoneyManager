import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Modal, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Chip, Searchbar } from 'react-native-paper';
import {
  getBills,
  getBillsSummary,
  getBillInsights,
  markBillPaid,
  skipBill,
  deleteBill,
} from '../services/bills';
import { getCategories } from '../services/categories';
import BillSummaryBar from '../components/BillSummaryBar';
import SwipeableBillCard from '../components/SwipeableBillCard';
import BillCalendarView from '../components/BillCalendarView';
import BillForm from '../components/BillForm';
import ConfirmDialog from '../components/ConfirmDialog';
import FAB from '../components/FAB';
import { Colors, Spacing } from '../components/Theme';
import { BILL_STATUS, formatCurrency } from '../services/billUtils';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: BILL_STATUS.PENDING, label: 'Pending' },
  { key: BILL_STATUS.OVERDUE, label: 'Overdue' },
  { key: BILL_STATUS.PAID, label: 'Paid' },
];

export default function BillsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState('due_date');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState('delete');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  async function load() {
    const [rows, sum, ins, cats] = await Promise.all([
      getBills({
        status: statusFilter === 'all' ? null : statusFilter,
        category_id: categoryFilter,
        sortBy,
        sortDir: sortBy === 'amount' ? 'desc' : 'asc',
      }),
      getBillsSummary(),
      getBillInsights(),
      getCategories(true),
    ]);
    setItems(rows);
    setSummary(sum);
    setInsights(ins);
    setCategories(cats.filter((c) => c.type === 'expense'));
    const map = {};
    for (const c of cats) map[c.id] = c;
    setCategoriesMap(map);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [statusFilter, categoryFilter, sortBy])
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((b) => b.name?.toLowerCase().includes(q));
  }, [items, search]);

  function openDetail(bill) {
    navigation.navigate('BillDetail', { billId: bill.id });
  }

  function openEdit(bill) {
    setEditingBill(bill);
    setShowForm(true);
  }

  async function handleMarkPaid(bill) {
    await markBillPaid(bill.id, { source_id: bill.source_id });
    load();
  }

  function handleSkip(bill) {
    setConfirmTarget(bill);
    setConfirmAction('skip');
    setConfirmMessage(`Skip "${bill.name}" for this period?`);
    setConfirmVisible(true);
  }

  const renderBill = useCallback(
    ({ item }) => (
      <SwipeableBillCard
        bill={item}
        category={categoriesMap[item.category_id]}
        onPress={openDetail}
        onMarkPaid={handleMarkPaid}
        onSkip={handleSkip}
        onEdit={openEdit}
      />
    ),
    [categoriesMap]
  );

  const listHeader = (
    <View>
      <BillSummaryBar summary={summary} />

      {summary?.overdueCount > 0 ? (
        <View
          style={{
            backgroundColor: '#FFF0F0',
            borderRadius: 10,
            padding: 12,
            marginBottom: Spacing.m,
            borderLeftWidth: 4,
            borderLeftColor: '#E46A6A',
          }}
        >
          <Text style={{ color: '#E46A6A', fontWeight: '700' }}>
            {summary.overdueCount} overdue bill{summary.overdueCount > 1 ? 's' : ''} — {formatCurrency(summary.overdueAmount)}
          </Text>
        </View>
      ) : null}

      {insights ? (
        <View
          style={{
            backgroundColor: Colors.card,
            borderRadius: 12,
            padding: Spacing.m,
            marginBottom: Spacing.m,
          }}
        >
          <Text style={{ fontWeight: '700', marginBottom: 8, color: Colors.text }}>Insights</Text>
          <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 4 }}>
            Recurring bills total: {formatCurrency(insights.recurringMonthlyTotal)}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 4 }}>
            Upcoming (7 days): {insights.upcomingDues?.length || 0} bill(s)
          </Text>
          {insights.topCategoryId ? (
            <Text style={{ color: Colors.muted, fontSize: 13 }}>
              Top category: {categoriesMap[insights.topCategoryId]?.name || 'Unknown'} ({formatCurrency(insights.topCategoryAmount)})
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', marginBottom: Spacing.s }}>
        <Chip
          selected={viewMode === 'list'}
          onPress={() => setViewMode('list')}
          style={{ marginRight: 8 }}
        >
          List
        </Chip>
        <Chip selected={viewMode === 'calendar'} onPress={() => setViewMode('calendar')}>
          Calendar
        </Chip>
      </View>

      <Searchbar
        placeholder="Search bills"
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: Spacing.s, backgroundColor: Colors.card }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.s }}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.key}
            selected={statusFilter === f.key}
            onPress={() => setStatusFilter(f.key)}
            style={{ marginRight: 6, marginBottom: 6 }}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.s }}>
        <Chip
          selected={!categoryFilter}
          onPress={() => setCategoryFilter(null)}
          style={{ marginRight: 6, marginBottom: 6 }}
        >
          All categories
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            selected={categoryFilter === c.id}
            onPress={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
            style={{ marginRight: 6, marginBottom: 6 }}
          >
            {c.name}
          </Chip>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginBottom: Spacing.m }}>
        <TouchableOpacity onPress={() => setSortBy('due_date')} style={{ marginRight: 16 }}>
          <Text style={{ color: sortBy === 'due_date' ? Colors.primary : Colors.muted, fontWeight: '600' }}>
            Sort: Due date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSortBy('amount')}>
          <Text style={{ color: sortBy === 'amount' ? Colors.primary : Colors.muted, fontWeight: '600' }}>
            Sort: Amount
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? (
        <BillCalendarView
          bills={filteredItems}
          month={calMonth}
          year={calYear}
          onSelectBill={openDetail}
          onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
        />
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {viewMode === 'list' ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderBill}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          ListEmptyComponent={
            <Text style={{ color: Colors.muted, textAlign: 'center', marginTop: 24 }}>
              No bills found. Tap + to add one.
            </Text>
          }
        />
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        />
      )}

      <FAB
        onPress={() => { setEditingBill(null); setShowForm(true); }}
        style={{ position: 'absolute', right: 20, bottom: 24 }}
      />

      <Modal visible={showForm} animationType="slide">
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{ padding: Spacing.m, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#EEF1F6' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text }}>
              {editingBill ? 'Edit Bill' : 'New Bill'}
            </Text>
          </View>
          <BillForm
            bill={editingBill}
            onSaved={() => { setShowForm(false); setEditingBill(null); load(); }}
            onCancel={() => { setShowForm(false); setEditingBill(null); }}
          />
        </View>
      </Modal>

      <ConfirmDialog
        visible={confirmVisible}
        title={confirmAction === 'delete' ? 'Delete Bill' : 'Skip Bill'}
        message={confirmMessage}
        onCancel={() => { setConfirmVisible(false); setConfirmTarget(null); }}
        onConfirm={async () => {
          if (confirmTarget) {
            if (confirmAction === 'delete') await deleteBill(confirmTarget.id);
            else await skipBill(confirmTarget.id);
            load();
          }
          setConfirmVisible(false);
          setConfirmTarget(null);
        }}
      />
    </View>
  );
}
