import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Platform } from 'react-native';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/transactions';
import { getCategories } from '../services/categories';
import { getSources } from '../services/sources';
import ConfirmDialog from '../components/ConfirmDialog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, TextInput as PaperTextInput, Button as PaperButton, Chip, Searchbar } from 'react-native-paper';
import Card from '../components/Card';
import { Colors, Spacing } from '../components/Theme';
import CategoryCreateModal from '../components/CategoryCreateModal';
import { Feather } from '@expo/vector-icons';
import FAB from '../components/FAB';

export default function TransactionsScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState('expense');
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [sources, setSources] = useState([]);
  const [editSourceId, setEditSourceId] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showCategoryCreateModal, setShowCategoryCreateModal] = useState(false);

  const [catSearch, setCatSearch] = useState('');
  const [srcSearch, setSrcSearch] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState(new Date().toISOString());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editPickerMode, setEditPickerMode] = useState('date');
  const [editNotesError, setEditNotesError] = useState(false);
  const [editAmountError, setEditAmountError] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Are you sure you want to delete this transaction?');
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    const t = await getTransactions(1000000);
    setItems(t);
    const cats = await getCategories(true);
    setCategories(cats);
    const src = await getSources(true);
    setSources(src);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { load(); });
    return unsub;
  }, [navigation]);

  // start inline edit if navigated with editId
  useEffect(() => {
    if (route && route.params && route.params.editId) {
      const id = route.params.editId;
      const it = items.find(i => i.id === id);
      if (it) {
        setEditingId(it.id);
        setEditAmount(String(it.amount));
        setEditType(it.type || 'expense');
        setEditCategoryId(it.category_id || null);
        setEditSourceId(it.source_id || null);
        setEditNotes(it.notes || '');
        setEditDate(it.date || new Date().toISOString());
      }
    }
  }, [route, items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.notes || '').toLowerCase().includes(q) ||
      String(item.amount).includes(q)
    );
  }, [items, searchQuery]);

  const formatDate = (date) => {
    const d = new Date(date);

    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();

    const time = d.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${day} ${month} ${year}, ${time}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: Spacing.m, paddingBottom: 0 }}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }}
          inputStyle={{ fontSize: 14 }}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#ccc" />
            <Text style={{ color: Colors.muted, marginTop: 12 }}>No transactions found</Text>
          </View>
        }
        initialNumToRender={15}
        windowSize={10}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: Spacing.s }}>
            {editingId === item.id ? (
              <View>
                <View style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <View style={{ backgroundColor: editType === 'expense' ? '#FFF6F6' : '#F6FFFA', padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: editType === 'expense' ? '#E46A6A' : '#36B37E', fontWeight: '700' }}>{editType.toUpperCase()}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: editType === 'expense' ? '#E46A6A' : '#36B37E' }}>{editAmount ? Number(editAmount).toFixed(2) : '0.00'}</Text>
                  </View>
                </View>
                <PaperTextInput label="Amount" value={String(editAmount)} onChangeText={(t) => { setEditAmount(t); if (editAmountError) setEditAmountError(false); }} keyboardType="numeric" mode="outlined" style={{ marginBottom: 8 }} error={editAmountError} />
                {editAmountError ? <Text style={{ color: '#E46A6A', marginBottom: 8 }}>Enter an amount greater than 0</Text> : null}

                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <Chip
                    mode={editType === 'expense' ? 'flat' : 'outlined'}
                    selected={editType === 'expense'}
                    onPress={() => setEditType('expense')}
                    style={{ marginRight: 8, backgroundColor: editType === 'expense' ? '#FEE2E2' : 'transparent' }}
                    selectedColor="#E46A6A"
                  >Expense</Chip>
                  <Chip
                    mode={editType === 'income' ? 'flat' : 'outlined'}
                    selected={editType === 'income'}
                    onPress={() => setEditType('income')}
                    style={{ backgroundColor: editType === 'income' ? '#D1FAE5' : 'transparent' }}
                    selectedColor="#36B37E"
                  >Income</Chip>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: Colors.muted, marginBottom: 4 }}>Category</Text>
                    <TouchableOpacity onPress={() => setShowCategoryPicker(true)} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, backgroundColor: '#fafafa' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={(categories.find(x => x.id === editCategoryId) || {}).icon || 'tag'} size={18} color={(categories.find(x => x.id === editCategoryId) || {}).color || '#4B7CF3'} style={{ marginRight: 8 }} />
                        <Text numberOfLines={1}>{(categories.find(x => x.id === editCategoryId) || {}).name || 'Select'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: Colors.muted, marginBottom: 4 }}>Source</Text>
                    <TouchableOpacity onPress={() => setShowSourcePicker(true)} style={{ borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, backgroundColor: '#fafafa' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons name={(sources.find(x => x.id === editSourceId) || {}).icon || 'cash'} size={18} color="#4B7CF3" style={{ marginRight: 8 }} />
                        <Text numberOfLines={1}>{(sources.find(x => x.id === editSourceId) || {}).name || 'Select'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, maxHeight: '80%' }}>
                      <PaperTextInput label="Search Categories" value={catSearch} onChangeText={setCatSearch} mode="outlined" style={{ marginBottom: 8 }} />
                      <FlatList
                        data={categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))}
                        keyExtractor={i => String(i.id)}
                        renderItem={({ item: c }) => (
                          <TouchableOpacity onPress={() => { setEditCategoryId(c.id); setShowCategoryPicker(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#f3f3f3', backgroundColor: editCategoryId === c.id ? '#FFF9F9' : '#fff' }}>
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.color || '#eee', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                              <MaterialCommunityIcons name={c.icon || 'tag'} size={18} color={'#fff'} />
                            </View>
                            <Text style={{ fontSize: 16 }}>{c.name}</Text>
                          </TouchableOpacity>
                        )}
                        ListHeaderComponent={
                          <TouchableOpacity
                            onPress={() => { setShowCategoryPicker(false); setShowCategoryCreateModal(true); }}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#f3f3f3', backgroundColor: '#e6f7ff' }}
                          >
                            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.primary} style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 16, color: Colors.primary, fontWeight: '600' }}>Create New Category</Text>
                          </TouchableOpacity>
                        }
                        stickyHeaderIndices={[0]} // Make the "Create New Category" option stick to the top
                      />
                      <View style={{ height: Spacing.s }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <PaperButton mode="outlined" onPress={() => setShowCategoryPicker(false)}>Close</PaperButton>
                      </View>
                    </View>
                  </View>
                </Modal>

                <Modal visible={showSourcePicker} transparent animationType="slide" onRequestClose={() => setShowSourcePicker(false)}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8, maxHeight: '80%' }}>
                      <PaperTextInput label="Search" value={srcSearch} onChangeText={setSrcSearch} mode="outlined" style={{ marginBottom: 8 }} />
                      <FlatList data={sources.filter(s => s.name.toLowerCase().includes(srcSearch.toLowerCase()))} keyExtractor={i => String(i.id)} renderItem={({ item: s }) => (
                        <TouchableOpacity onPress={() => { setEditSourceId(s.id); setShowSourcePicker(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderColor: '#f3f3f3', backgroundColor: editSourceId === s.id ? '#F7FBFF' : '#fff' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef7ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <MaterialCommunityIcons name={s.icon || 'cash'} size={18} color={(s.icon_color) || '#4B7CF3'} />
                          </View>
                          <Text style={{ fontSize: 16 }}>{s.name}</Text>
                        </TouchableOpacity>
                      )} />
                      <View style={{ height: Spacing.s }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <PaperButton mode="outlined" onPress={() => setShowSourcePicker(false)}>Close</PaperButton>
                      </View>
                    </View>
                  </View>
                </Modal>

                <PaperTextInput
                  label="Notes"
                  value={editNotes}
                  onChangeText={(t) => { setEditNotes(t); if (editNotesError) setEditNotesError(false); }}
                  mode="outlined"
                  multiline
                  style={{ marginBottom: 12, backgroundColor: '#fff' }}
                  error={editNotesError}
                />
                {editNotesError ? <Text style={{ color: '#E46A6A', fontSize: 12, marginBottom: 8 }}>Notes are required</Text> : null}

                <TouchableOpacity
                  onPress={() => {
                    setEditPickerMode('date');
                    setShowEditDatePicker(true);
                  }}
                  style={{ marginBottom: 16 }}
                >
                  <PaperTextInput
                    label="Date & Time"
                    value={formatDate(editDate)}
                    editable={false}
                    pointerEvents="none"
                    mode="outlined"
                    right={<PaperTextInput.Icon icon="calendar" />}
                  />
                </TouchableOpacity>

                {showEditDatePicker && (
                  (() => {
                    // Use native picker on native platforms if available
                    if (Platform.OS !== 'web') {
                      try {
                        // eslint-disable-next-line global-require
                        const DateTimePicker = require('@react-native-community/datetimepicker').default;
                        return (
                          <DateTimePicker
                            value={new Date(editDate)}
                            mode={editPickerMode}
                            is24Hour={true}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selected) => {
                              const evType = event && (event.type || event.nativeEvent?.action);
                              if (Platform.OS === 'android') {
                                if (evType === 'dismissed' || evType === 'dismiss') { setShowEditDatePicker(false); setEditPickerMode('date'); return; }
                                if (editPickerMode === 'date') {
                                  const picked = selected || new Date();
                                  const prev = new Date(editDate);
                                  picked.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                                  setEditDate(picked.toISOString());
                                  setShowEditDatePicker(false);
                                  setEditPickerMode('time');
                                  setTimeout(() => setShowEditDatePicker(true), 50);
                                } else {
                                  const picked = selected || new Date();
                                  const prev = new Date(editDate);
                                  prev.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
                                  setEditDate(prev.toISOString());
                                  setShowEditDatePicker(false);
                                  setEditPickerMode('date');
                                }
                              } else {
                                if (selected) setEditDate(selected.toISOString());
                                setShowEditDatePicker(false);
                                setEditPickerMode('date');
                              }
                            }}
                          />
                        );
                      } catch (e) {
                        // fallthrough to manual picker
                      }
                    }

                    // Manual fallback for web or if native not available
                    const Manual = require('../components/ManualDateTimePicker').default;
                    const dt = new Date(editDate || new Date().toISOString());
                    const [y, m, d, h, min] = [dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes()];
                    return (
                      <Modal visible={showEditDatePicker} transparent animationType="slide" onRequestClose={() => setShowEditDatePicker(false)}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                          <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 8 }}>
                            <Manual year={y} month={m} day={d} hour={h} minute={min} onChange={(ny, nm, nd, nh, nmin) => setEditDate(new Date(ny, nm - 1, nd, nh, nmin).toISOString())} onClose={() => setShowEditDatePicker(false)} />
                          </View>
                        </View>
                      </Modal>
                    );
                  })()
                )}

                <View style={{ flexDirection: 'row' }}>
                  <PaperButton mode="contained" onPress={async () => {
                    const val = parseFloat(editAmount);
                    if (!editAmount || isNaN(val) || val === 0) { setEditAmountError(true); return; }
                    if (!editNotes || !editNotes.trim()) { setEditNotesError(true); return; }
                    await updateTransaction(item.id, { amount: val, type: editType, category_id: editCategoryId, source_id: editSourceId, notes: editNotes, date: editDate });
                    setEditingId(null); load();
                  }}
                    style={{ flex: 1, borderRadius: 10, backgroundColor: editType === 'expense' ? '#E46A6A' : '#36B37E' }}
                    contentStyle={{ paddingVertical: 4 }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}>Save</PaperButton>
                  <View style={{ width: 8 }} />
                  <PaperButton mode="outlined" onPress={() => setEditingId(null)} style={{ flex: 1, borderRadius: 10 }} contentStyle={{ paddingVertical: 4 }}>Cancel</PaperButton>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {(() => {
                    const cat = categories.find(x => x.id === item.category_id);
                    return (
                      <Avatar.Icon
                        size={40}
                        icon={cat?.icon || 'tag'}
                        style={{ backgroundColor: (cat?.color || '#eee') + '15', marginRight: 12 }}
                        color={cat?.color || '#999'}
                      />
                    );
                  })()}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontWeight: '700', fontSize: 15, color: Colors.text }}>
                      {item.notes || 'No notes'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Text style={{ color: Colors.muted, fontSize: 12 }}>
                        {categories.find(x => x.id === item.category_id)?.name || 'Uncategorized'}
                      </Text>
                      <Text style={{ color: '#ccc', marginHorizontal: 4 }}>•</Text>
                      <Text style={{ color: Colors.muted, fontSize: 12 }}>
                        {sources.find(x => x.id === item.source_id)?.name || 'No source'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{
                    fontWeight: '800',
                    fontSize: 16,
                    color: item.type === 'expense' ? '#E46A6A' : '#36B37E'
                  }}>
                    {item.type === 'expense' ? '-' : '+'}₹{Number(item.amount).toFixed(2)}
                  </Text>
                  <Text style={{ color: Colors.muted, fontSize: 10, marginTop: 2 }}>
                    {new Date(item.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </Text>

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(item.id);
                        setEditAmount(String(item.amount));
                        setEditType(item.type || 'expense');
                        setEditCategoryId(item.category_id || null);
                        setEditSourceId(item.source_id || null);
                        setEditNotes(item.notes || '');
                        setEditDate(item.date || new Date().toISOString());
                      }} style={{ marginRight: 10 }}>
                      <Feather name="edit-2" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setConfirmTargetId(item.id);
                        setConfirmMessage(`Delete transaction ${item.type} ${Number(item.amount).toFixed(2)}?`);
                        setConfirmVisible(true);
                      }} >
                      <Feather name="trash-2" size={16} color="#E46A6A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Card>
        )}
      />

      <CategoryCreateModal
        visible={showCategoryCreateModal}
        onClose={() => setShowCategoryCreateModal(false)}
        onCategoryCreated={(newCategory) => {
          load(); // Reload all categories
          if (editingId !== null) {
            setEditCategoryId(newCategory.id); // Select the newly created category only if editing
          }
        }}
        currentType={editType}
      />
      <FAB onPress={() => navigation.navigate('TransactionAdd')} />
      <ConfirmDialog visible={confirmVisible} title="Delete Transaction" message={confirmMessage} onCancel={() => { setConfirmVisible(false); setConfirmTargetId(null); }} onConfirm={async () => { if (confirmTargetId) { await deleteTransaction(confirmTargetId); } setConfirmVisible(false); setConfirmTargetId(null); load(); }} />
    </View>
  );
}
