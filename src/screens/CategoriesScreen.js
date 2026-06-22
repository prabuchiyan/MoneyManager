import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput as PaperTextInput, Button as PaperButton, Searchbar, Avatar } from 'react-native-paper';
import IconPicker from '../components/IconPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import ColorPickerModal from '../components/ColorPickerModal';
import { getCategories, softDeleteCategory, updateCategory } from '../services/categories';
import Card from '../components/Card';
import IconButton from '../components/IconButton';
import { Spacing } from '../components/Theme';
import CategoryCreateModal from '../components/CategoryCreateModal';
import FAB from '../components/FAB';

export default function CategoriesScreen({ route }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
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
  const [showColorPickerForAdd, setShowColorPickerForAdd] = useState(false);
  const [showColorPickerForEdit, setShowColorPickerForEdit] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Are you sure you want to delete this item?');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.name || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

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

      <View style={{ padding: Spacing.m, paddingBottom: 0 }}>
        <Searchbar
          placeholder="Search Categories..."
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
                  <PaperButton
                    mode={type === 'income' ? 'contained' : 'outlined'}
                    onPress={() => setEditType('income')}
                    style={{ marginRight: Spacing.s }}
                  >
                    Income
                  </PaperButton>
                  <PaperButton
                    mode={type === 'expense' ? 'contained' : 'outlined'}
                    onPress={() => setEditType('expense')}
                  >
                    Expense
                  </PaperButton>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>

                  <TouchableOpacity
                    onPress={() => setShowIconPickerForEdit(true)}
                    style={[styles.iconSelector, { backgroundColor: (editColor || Colors.primary) + '15' }]}
                  >
                    <MaterialCommunityIcons name={editIcon} size={24} color={editColor} />
                  </TouchableOpacity>

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

                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => { setEditCategory(item); setShowModal(true); }} style={{ marginRight: 12 }}>
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

      <ColorPickerModal
        visible={showColorPickerForAdd}
        onClose={() => setShowColorPickerForAdd(false)}
        onSelect={setSelectedColor}
        currentColor={selectedColor}
      />
      <ColorPickerModal
        visible={showColorPickerForEdit}
        onClose={() => setShowColorPickerForEdit(false)}
        onSelect={setEditColor}
        currentColor={editColor}
      />

      <CategoryCreateModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        editData={editCategory}
        onSave={() => {
          setShowModal(false);
          load();
        }}
      />

      <FAB onPress={() => { setEditCategory(null); setShowModal(true); }} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});