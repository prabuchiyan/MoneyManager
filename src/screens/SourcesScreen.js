import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput as PaperInput, Button as PaperButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import IconButton from '../components/IconButton';
import { createSource, getSources, deleteSource, updateSource } from '../services/sources';
import Card from '../components/Card';
import IconPicker from '../components/IconPicker'; // Assuming this is a custom component
import ColorPickerModal from '../components/ColorPickerModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Colors, Spacing } from '../components/Theme';

export default function SourcesScreen() {

  const [items, setItems] = useState([]);

  const [name, setName] = useState('');
  const [initial, setInitial] = useState('0');

  const [selectedIcon, setSelectedIcon] = useState('cash');
  const [selectedColor, setSelectedColor] = useState('#4B7CF3');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editInitial, setEditInitial] = useState('0');
  const [editIcon, setEditIcon] = useState('cash');
  const [editColor, setEditColor] = useState('#4B7CF3');

  const [showIconPickerAdd, setShowIconPickerAdd] = useState(false);
  const [showIconPickerEdit, setShowIconPickerEdit] = useState(false);

  const [showColorPickerAdd, setShowColorPickerAdd] = useState(false);
  const [showColorPickerEdit, setShowColorPickerEdit] = useState(false);

  const [customColorInputAdd, setCustomColorInputAdd] = useState('');
  const [customColorInputEdit, setCustomColorInputEdit] = useState('');

  const EXTENDED_COLORS = ['#4B7CF3', '#3B82F6', '#2563EB', '#6366F1', '#8B5CF6', '#A78BFA', '#F97316', '#FB923C', '#F59E0B', '#FBBF24', '#16A34A', '#22C55E', '#A3E635', '#84CC16', '#DC2626', '#EF4444', '#F43F5E', '#DB2777', '#0EA5A4', '#14B8A6', '#06B6D4', '#0891B2', '#334155', '#475569', '#64748B'];

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  async function load() {
    const rows = await getSources(true);
    setItems(rows);
  }

  useEffect(() => { load(); }, []);

  // Simple suggestions map: keyword -> preferred icon
  function suggestIconForText(text) {
    if (!text) return 'tag';
    const t = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = t.split(/\s+/).filter(Boolean);
    const suggestions = {
      bank: 'bank',
      wallet: 'wallet',
      cash: 'cash'
    };

    const glyph = MaterialCommunityIcons && MaterialCommunityIcons.glyphMap ? MaterialCommunityIcons.glyphMap : {};
    const isValid = (ic) => !!glyph[ic];
    const fallbackList = ['tag', 'shopping', 'home', 'cash', 'credit-card', 'wallet', 'food', 'gift', 'account'];
    function chooseValid(ic) {
      if (isValid(ic)) return ic;
      for (const f of fallbackList) if (isValid(f)) return f;
      return 'tag';
    }

    // 1) exact token lookup
    for (const token of tokens) {
      if (suggestions[token]) return chooseValid(suggestions[token]);
    }
    // 2) whole text word-boundary lookup
    for (const key of Object.keys(suggestions)) {
      try {
        const re = new RegExp('\\b' + key + '\\b');
        if (re.test(t)) return chooseValid(suggestions[key]);
      } catch (e) { }
    }
    // 3) fuzzy token contains
    for (const token of tokens) {
      for (const key of Object.keys(suggestions)) if (token.includes(key) || key.includes(token)) return chooseValid(suggestions[key]);
    }

    // fallback to a safe default
    return chooseValid('tag');
  }

  useEffect(() => {
    setSelectedIcon(suggestIconForText(name));
  }, [name]);

  useEffect(() => {
    setEditIcon(suggestIconForText(editName));
  }, [editName]);

  async function add() {
    if (!name) return;
    await createSource({
      name,
      initial_balance: parseFloat(initial) || 0,
      icon: selectedIcon,
      color: selectedColor
    });
    setName('');
    setInitial('0');
    setSelectedIcon('cash');
    setSelectedColor('#4B7CF3');
    load();
  }

  async function remove(id) {
    await deleteSource(id);
    load();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditInitial(String(item.initial_balance || 0));
    setEditIcon(item.icon || 'cash');
    setEditColor(item.color || '#4B7CF3');
  }

  async function saveEdit() {
    await updateSource(editingId, {
      name: editName,
      initial_balance: parseFloat(editInitial) || 0,
      icon: editIcon,
      color: editColor,
      is_active: 1
    });
    setEditingId(null);
    load();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Sources</Text>
        <Text style={styles.headerSubtitle}>Add or edit your payment accounts</Text>
      </View>

      <Card style={styles.addCard}>
        <PaperInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <PaperInput
          label="Initial Balance"
          value={initial}
          onChangeText={setInitial}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setShowIconPickerAdd(true)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#eee'
            }}
          >
            <MaterialCommunityIcons
              name={selectedIcon}
              size={22}
              color={selectedColor}
            />
          </TouchableOpacity>
          <IconButton label="Colors" icon="droplet" onPress={() => setShowColorPickerAdd(true)} />
          <IconButton label="Icon" icon="image" onPress={() => setShowIconPickerAdd(true)} />

          <View style={{ flex: 1 }} />
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ flexDirection: 'right' }}>
            <PaperButton
              mode="contained"
              onPress={add}
              style={{ alignSelf: 'flex-start' }}
            >
              Add Source
            </PaperButton>
          </View>
        </View>
      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            {editingId === item.id ? (
              <View>
                <PaperInput label="Name" value={editName} onChangeText={setEditName} mode="outlined" style={styles.input} />
                <PaperInput label="Initial Balance" value={editInitial} onChangeText={setEditInitial} mode="outlined" keyboardType="numeric" style={styles.input} />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={() => setShowIconPickerEdit(true)}
                    style={[styles.iconSelector, { backgroundColor: (editColor || Colors.primary) + '15' }]}
                  >
                    <MaterialCommunityIcons name={editIcon} size={24} color={editColor} />
                  </TouchableOpacity>
                  <IconButton label="Icon" icon="image" onPress={() => setShowIconPickerEdit(true)} />
                  <IconButton label="Colors" icon="droplet" onPress={() => setShowColorPickerEdit(true)} />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <PaperButton mode="contained" onPress={saveEdit}>Save</PaperButton>
                  <View style={{ width: 8 }} />
                  <PaperButton mode="outlined" onPress={() => setEditingId(null)}>Cancel</PaperButton>
                </View>
              </View>
            ) : (
              <View style={styles.itemRow}>
                <View style={[styles.itemIconWrapper, { backgroundColor: (item.color || Colors.primary) + '15' }]}>
                  <MaterialCommunityIcons
                    name={item.icon || 'cash'}
                    size={22}
                    color={item.color || Colors.primary}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemBalance}>₹{Number(item.initial_balance || 0).toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionBtn}>
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
            )}
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

      <IconPicker visible={showIconPickerAdd} onClose={() => setShowIconPickerAdd(false)} onSelect={setSelectedIcon} />
      <IconPicker visible={showIconPickerEdit} onClose={() => setShowIconPickerEdit(false)} onSelect={setEditIcon} />

      <ColorPickerModal
        visible={showColorPickerAdd}
        onClose={() => setShowColorPickerAdd(false)}
        onSelect={setSelectedColor}
        currentColor={selectedColor}
      />
      <ColorPickerModal
        visible={showColorPickerEdit}
        onClose={() => setShowColorPickerEdit(false)}
        onSelect={setEditColor}
        currentColor={editColor}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.m,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
  },
  addCard: {
    margin: Spacing.m,
    padding: 16,
    borderRadius: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconSelector: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  addBtn: {
    borderRadius: 12,
  },
  addBtnLabel: {
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.m,
    paddingTop: 0,
    paddingBottom: 40,
  },
  itemCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  itemBalance: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
});