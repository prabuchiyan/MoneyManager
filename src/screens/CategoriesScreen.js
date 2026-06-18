import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput as PaperTextInput, Button as PaperButton, Chip, Avatar } from 'react-native-paper';
import IconPicker from '../components/IconPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { createCategory, getCategories, softDeleteCategory, updateCategory } from '../services/categories';
import Card from '../components/Card';
import IconButton from '../components/IconButton';
import { Spacing } from '../components/Theme';

export default function CategoriesScreen({ route }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('expense');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#4B7CF3');
  const [editIcon, setEditIcon] = useState('tag');
  const [editColor, setEditColor] = useState('#4B7CF3');
  const [showIconPickerForAdd, setShowIconPickerForAdd] = useState(false);
  const [showIconPickerForEdit, setShowIconPickerForEdit] = useState(false);
  const [userPickedIconAdd, setUserPickedIconAdd] = useState(false);
  const [userPickedIconEdit, setUserPickedIconEdit] = useState(false);

  const ICON_OPTIONS = ['tag', 'shopping-bag', 'home', 'credit-card', 'dollar-sign', 'book', 'heart', 'coffee'];
  const COLOR_OPTIONS = ['#4B7CF3', '#FFA500', '#2ECC71', '#E74C3C', '#9B59B6', '#F1C40F', '#34495E', '#1ABC9C'];
  const EXTENDED_COLORS = ['#4B7CF3', '#3B82F6', '#2563EB', '#6366F1', '#8B5CF6', '#A78BFA', '#F97316', '#FB923C', '#F59E0B', '#FBBF24', '#16A34A', '#22C55E', '#A3E635', '#84CC16', '#DC2626', '#EF4444', '#F43F5E', '#DB2777', '#0EA5A4', '#14B8A6', '#06B6D4', '#0891B2', '#334155', '#475569', '#64748B'];

  const [showColorPickerForAdd, setShowColorPickerForAdd] = useState(false);
  const [showColorPickerForEdit, setShowColorPickerForEdit] = useState(false);
  const [customColorInputAdd, setCustomColorInputAdd] = useState('');
  const [customColorInputEdit, setCustomColorInputEdit] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Are you sure you want to delete this item?');

  async function load() {
    const rows = await getCategories(true);
    setItems(rows);
  }

  useEffect(() => { load(); }, []);

  // If navigated with an editId param, start editing that category
  useEffect(() => {
    if (route && route.params && route.params.editId) {
      const id = route.params.editId;
      const item = items.find(i => i.id === id);
      if (item) startEdit(item);
    }
  }, [route, items]);

  async function add() {
    if (!name) return;
    await createCategory({ name, type, icon: selectedIcon, color: selectedColor });
    setName('');
    setSelectedIcon('tag');
    setSelectedColor('#4B7CF3');
    setUserPickedIconAdd(false);
    load();
  }

  function handleNameChange(t) {
    setName(t);
    if (userPickedIconAdd) setUserPickedIconAdd(false);
  }

  async function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name || '');
    setEditType(item.type || 'expense');
    setEditIcon(item.icon || 'tag');
    setEditColor(item.color || '#4B7CF3');
    setUserPickedIconEdit(false);
  }

  function handleEditNameChange(t) {
    setEditName(t);
    if (userPickedIconEdit) setUserPickedIconEdit(false);
  }

  async function saveEdit() {
    await updateCategory(editingId, { name: editName, type: editType, icon: editIcon, color: editColor, is_active: 1 });
    setEditingId(null);
    setEditName('');
    setEditType('expense');
    setEditIcon('tag');
    setEditColor('#4B7CF3');
    setUserPickedIconEdit(false);
    load();
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditType('expense');
  }

  async function remove(id) {
    await softDeleteCategory(id);
    load();
  }

  // Simple suggestions map: keyword -> preferred icon
  function suggestIconForText(text) {
    if (!text) return 'tag';
    const t = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = t.split(/\s+/).filter(Boolean);
    const suggestions = {
      gym: 'dumbbell',
      fitness: 'dumbbell',
      snack: 'food-apple',
      food: 'food',
      coffee: 'coffee',
      tea: 'coffee',
      veg: 'leaf',
      vegetable: 'leaf',
      non: 'food-drumstick',
      meat: 'food-drumstick',
      dinner: 'silverware-fork-knife',
      lunch: 'silverware-fork-knife',
      breakfast: 'silverware-fork-knife',
      rent: 'home',
      grocer: 'shopping',
      grocery: 'shopping',
      salary: 'cash',
      income: 'cash',
      transport: 'car',
      travel: 'car',
      movie: 'movie',
      music: 'music'
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

  // Auto-suggest icon while typing (unless user manually picked one)
  React.useEffect(() => {
    if (!userPickedIconAdd) {
      const s = suggestIconForText(name);
      setSelectedIcon(s);
    }
  }, [name, userPickedIconAdd]);

  React.useEffect(() => {
    if (!userPickedIconEdit && editName) {
      const s = suggestIconForText(editName);
      setEditIcon(s);
    }
  }, [editName, userPickedIconEdit]);

  return (
    <View style={{ flex: 1 }}>
      <Card style={{ margin: Spacing.m }}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Categories</Text>
        <PaperTextInput label="Name" value={name} onChangeText={handleNameChange} mode="outlined" style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            <Chip mode="outlined" selected={type === 'income'} onPress={() => setType('income')} style={{ marginRight: 8 }}>Income</Chip>
            <Chip mode="outlined" selected={type === 'expense'} onPress={() => setType('expense')}>Expense</Chip>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setShowIconPickerForAdd(true)} style={{ padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }}>
            <MaterialCommunityIcons name={selectedIcon} size={22} color={selectedColor} />
          </TouchableOpacity>
          <View />
          <IconButton label="Colors" icon="droplet" onPress={() => setShowColorPickerForAdd(true)} />
          <IconButton label="Icon" icon="image" onPress={() => setShowIconPickerForAdd(true)} />
          <View />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ flexDirection: 'right' }}>
            <PaperButton mode="contained" onPress={add} style={{ alignSelf: 'flex-start' }}>
              Add Category
            </PaperButton>
          </View>
        </View>
      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: Spacing.m }}
        ListEmptyComponent={() => (
          <Card style={{ padding: 16 }}>
            <Text style={{ color: '#888', textAlign: 'center' }}>
              No categories yet
            </Text>
          </Card>
        )}

        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>

            {editingId === item.id ? (
              <>
                <PaperTextInput
                  value={editName}
                  onChangeText={handleEditNameChange}
                  mode="outlined"
                  style={{ marginBottom: 10 }}
                />
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  <TouchableOpacity
                    onPress={() => setEditType('income')}
                    style={{
                      backgroundColor: editType === 'income' ? '#2ECC71' : '#eee',
                      padding: 10,
                      borderRadius: 10,
                      marginRight: 8
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-down-bold" size={18} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setEditType('expense')}
                    style={{
                      backgroundColor: editType === 'expense' ? '#E74C3C' : '#eee',
                      padding: 10,
                      borderRadius: 10
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-up-bold" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => setShowIconPickerForEdit(true)}>
                    <Avatar.Icon size={32} icon={editIcon} style={{ backgroundColor: editColor }} />
                  </TouchableOpacity>
                  <IconButton label="Colors" icon="droplet" onPress={() => setShowColorPickerForEdit(true)} />
                  <IconButton label="Icon" icon="image" onPress={() => setShowIconPickerForEdit(true)} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <PaperButton
                    mode="text"
                    onPress={cancelEdit}
                    style={{ marginRight: 8 }}
                    labelStyle={{ fontSize: 13 }}
                  >
                    Cancel
                  </PaperButton>

                  <PaperButton
                    mode="contained"
                    onPress={saveEdit}
                    contentStyle={{ paddingHorizontal: 12 }}
                    labelStyle={{ fontSize: 13 }}
                  >
                    Save
                  </PaperButton>
                </View>

              </>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Avatar.Icon
                    size={36}
                    icon={item.icon || 'tag'}
                    style={{
                      backgroundColor: item.color || '#4B7CF3',
                      marginRight: 10
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontWeight: '600' }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      color: item.type === 'income' ? '#2ECC71' : '#E74C3C'
                    }}>
                      {item.type === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => startEdit(item)} style={{ marginRight: 12 }}>
                    <Feather name="edit-2" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setConfirmTargetId(item.id);
                      setConfirmMessage(`Delete "${item.name}"?`);
                      setConfirmVisible(true);
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#E74C3C" />
                  </TouchableOpacity>
                </View>

              </View>
            )}

          </Card>
        )}
      />

      <ConfirmDialog visible={confirmVisible} title="Delete Category" message={confirmMessage} onCancel={() => { setConfirmVisible(false); setConfirmTargetId(null); }} onConfirm={async () => { if (confirmTargetId) { await remove(confirmTargetId); } setConfirmVisible(false); setConfirmTargetId(null); }} />

      <IconPicker visible={showIconPickerForAdd} onClose={() => setShowIconPickerForAdd(false)} onSelect={(name) => { setSelectedIcon(name); setUserPickedIconAdd(true); }} />
      <IconPicker visible={showIconPickerForEdit} onClose={() => setShowIconPickerForEdit(false)} onSelect={(name) => { setEditIcon(name); setUserPickedIconEdit(true); }} />

      <Modal visible={showColorPickerForAdd} transparent animationType="slide" onRequestClose={() => setShowColorPickerForAdd(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Choose color</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {EXTENDED_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setSelectedColor(c); setShowColorPickerForAdd(false); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, margin: 6, borderWidth: selectedColor === c ? 2 : 0, borderColor: '#222' }} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <TextInput placeholder="#rrggbb" value={customColorInputAdd} onChangeText={setCustomColorInputAdd} style={{ flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8 }} />
              <View style={{ width: 8 }} />
              <IconButton label="Apply" icon="check" onPress={() => { const hex = customColorInputAdd.trim(); if (/^#([0-9A-Fa-f]{6})$/.test(hex)) { setSelectedColor(hex); setShowColorPickerForAdd(false); setCustomColorInputAdd(''); } }} />
            </View>
            <View style={{ height: 8 }} />
            <IconButton label="Close" icon="x" onPress={() => setShowColorPickerForAdd(false)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={showColorPickerForEdit} transparent animationType="slide" onRequestClose={() => setShowColorPickerForEdit(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Choose color</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {EXTENDED_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setEditColor(c); setShowColorPickerForEdit(false); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, margin: 6, borderWidth: editColor === c ? 2 : 0, borderColor: '#222' }} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <TextInput placeholder="#rrggbb" value={customColorInputEdit} onChangeText={setCustomColorInputEdit} style={{ flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8 }} />
              <View style={{ width: 8 }} />
              <IconButton label="Apply" icon="check" onPress={() => { const hex = customColorInputEdit.trim(); if (/^#([0-9A-Fa-f]{6})$/.test(hex)) { setEditColor(hex); setShowColorPickerForEdit(false); setCustomColorInputEdit(''); } }} />
            </View>
            <View style={{ height: 8 }} />
            <IconButton label="Close" icon="x" onPress={() => setShowColorPickerForEdit(false)} />
          </Card>
        </View>
      </Modal>
    </View>
  );
}
