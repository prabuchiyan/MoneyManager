import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { TextInput as PaperInput, Button as PaperButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IconButton from '../components/IconButton';
import { createSource, getSources, deleteSource, updateSource } from '../services/sources';
import Card from '../components/Card';
import IconPicker from '../components/IconPicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { Spacing } from '../components/Theme';

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
    console.log('Prabu rows', rows);
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
    <View style={{ flex: 1 }}>

      <Card style={{ margin: Spacing.m }}>
        <PaperInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={{ marginBottom: 8 }}
        />

        <PaperInput
          label="Initial Balance"
          value={initial}
          onChangeText={setInitial}
          keyboardType="numeric"
          mode="outlined"
          style={{ marginBottom: 8 }}
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
          <PaperButton
            mode="contained"
            onPress={add}
            style={{ alignSelf: 'flex-start' }}
          >
            Add Source
          </PaperButton>
        </View>

      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: Spacing.m }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: Spacing.s }}>
            {editingId === item.id ? (
              <View>
                <PaperInput value={editName} onChangeText={setEditName} mode="outlined" style={{ marginBottom: 6 }} />
                <PaperInput value={editInitial} onChangeText={setEditInitial} mode="outlined" keyboardType="numeric" style={{ marginBottom: 6 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TouchableOpacity onPress={() => setShowIconPickerEdit(true)} style={{ marginRight: 10 }}>
                    <Avatar.Icon size={28} icon={editIcon} style={{ backgroundColor: editColor }} />
                  </TouchableOpacity>
                  <IconButton label="Icon" icon="image" onPress={() => setShowIconPickerEdit(true)} />
                  <IconButton label="Colors" icon="droplet" onPress={() => setShowColorPickerEdit(true)} />
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <PaperButton mode="contained" onPress={saveEdit}>Save</PaperButton>
                  <View style={{ width: 8 }} />
                  <PaperButton mode="outlined" onPress={() => setEditingId(null)}>Cancel</PaperButton>
                </View>
              </View>

            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar.Icon size={28} icon={item.icon || 'cash'} style={{ backgroundColor: item.color || '#4B7CF3', marginRight: 8 }} />
                  <Text>{item.name} — ₹{item.initial_balance}</Text>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <PaperButton compact onPress={() => startEdit(item)}>Edit</PaperButton>
                  <PaperButton compact mode="outlined" onPress={() => {
                    setConfirmTargetId(item.id);
                    setConfirmVisible(true);
                  }}>
                    Delete
                  </PaperButton>
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

      <Modal visible={showColorPickerAdd} transparent animationType="slide" onRequestClose={() => setShowColorPickerAdd(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Choose color</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {EXTENDED_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setSelectedColor(c); setShowColorPickerAdd(false); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, margin: 6, borderWidth: selectedColor === c ? 2 : 0, borderColor: '#222' }} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <PaperInput placeholder="#rrggbb" value={customColorInputAdd} onChangeText={setCustomColorInputAdd} style={{ flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8 }} />
              <View style={{ width: 8 }} />
              <IconButton label="Apply" icon="check" onPress={() => { const hex = customColorInputAdd.trim(); if (/^#([0-9A-Fa-f]{6})$/.test(hex)) { setSelectedColor(hex); setShowColorPickerAdd(false); setCustomColorInputAdd(''); } }} />
            </View>
            <View style={{ height: 8 }} />
            <IconButton label="Close" icon="x" onPress={() => setShowColorPickerAdd(false)} />
          </Card>
        </View>
      </Modal>

      <Modal visible={showColorPickerEdit} transparent animationType="slide" onRequestClose={() => setShowColorPickerEdit(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Choose color</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {EXTENDED_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setEditColor(c); setShowColorPickerEdit(false); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, margin: 6, borderWidth: selectedColor === c ? 2 : 0, borderColor: '#222' }} />
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
              <PaperInput placeholder="#rrggbb" value={customColorInputEdit} onChangeText={setCustomColorInputEdit} style={{ flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8 }} />
              <View style={{ width: 8 }} />
              <IconButton label="Apply" icon="check" onPress={() => { const hex = customColorInputEdit.trim(); if (/^#([0-9A-Fa-f]{6})$/.test(hex)) { setSelectedColor(hex); setShowColorPickerEdit(false); setCustomColorInputEdit(''); } }} />
            </View>
            <View style={{ height: 8 }} />
            <IconButton label="Close" icon="x" onPress={() => setShowColorPickerEdit(false)} />
          </Card>
        </View>
      </Modal>

    </View>
  );
}