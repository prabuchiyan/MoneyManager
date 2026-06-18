import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { TextInput as PaperInput, Button as PaperButton, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Card from './Card';
import IconButton from './IconButton';
import IconPicker from './IconPicker';
import ColorPickerModal from './ColorPickerModal'; // Assuming this is a custom component
import { createCategory } from '../services/categories';
import { Spacing } from './Theme';

export default function CategoryCreateModal({ visible, onClose, onCategoryCreated, currentType = 'expense' }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(currentType);
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#4B7CF3');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [nameError, setNameError] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setType(currentType);
      setSelectedIcon('tag');
      setSelectedColor('#4B7CF3');
      setNameError(false);
    }
  }, [visible, currentType]);

  // Simple icon suggestion based on name, similar to CategoriesScreen
  function suggestIconForText(text) {
    if (!text) return 'tag';
    const t = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = t.split(/\s+/).filter(Boolean);
    const suggestions = {
      gym: 'dumbbell', fitness: 'dumbbell', snack: 'food-apple', food: 'food', coffee: 'coffee', tea: 'coffee',
      veg: 'leaf', vegetable: 'leaf', non: 'food-drumstick', meat: 'food-drumstick', dinner: 'silverware-fork-knife',
      lunch: 'silverware-fork-knife', breakfast: 'silverware-fork-knife', rent: 'home', grocer: 'shopping',
      grocery: 'shopping', salary: 'cash', income: 'cash', transport: 'car', travel: 'car', movie: 'movie', music: 'music'
    };

    const glyph = MaterialCommunityIcons && MaterialCommunityIcons.glyphMap ? MaterialCommunityIcons.glyphMap : {};
    const isValid = (ic) => !!glyph[ic];
    const fallbackList = ['tag', 'shopping', 'home', 'cash', 'credit-card', 'wallet', 'food', 'gift', 'account'];
    function chooseValid(ic) {
      if (isValid(ic)) return ic;
      for (const f of fallbackList) if (isValid(f)) return f;
      return 'tag';
    }

    for (const token of tokens) { if (suggestions[token]) return chooseValid(suggestions[token]); }
    for (const key of Object.keys(suggestions)) {
      try { const re = new RegExp('\\b' + key + '\\b'); if (re.test(t)) return chooseValid(suggestions[key]); } catch (e) { }
    }
    for (const token of tokens) { for (const key of Object.keys(suggestions)) if (token.includes(key) || key.includes(token)) return chooseValid(suggestions[key]); }
    return chooseValid('tag');
  }

  useEffect(() => {
    setSelectedIcon(suggestIconForText(name));
  }, [name]);

  const handleCreateCategory = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);

    try {
      const newCategory = await createCategory({
        name: name.trim(),
        type,
        icon: selectedIcon,
        color: selectedColor,
      });
      onCategoryCreated(newCategory);
      onClose();
    } catch (error) {
      console.error('Error creating category:', error);
      // Optionally show an alert or toast to the user
      alert('Failed to create category. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.m }}>
        <Card style={{ padding: Spacing.m }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: Spacing.m }}>Create New Category</Text>

          <PaperInput
            label="Category Name"
            value={name}
            onChangeText={(text) => { setName(text); setNameError(false); }}
            mode="outlined"
            style={{ marginBottom: Spacing.s }}
            error={nameError}
          />
          {nameError && <Text style={{ color: 'red', marginBottom: Spacing.s }}>Category name is required.</Text>}

          <View style={{ flexDirection: 'row', marginBottom: Spacing.s }}>
            <PaperButton
              mode={type === 'income' ? 'contained' : 'outlined'}
              onPress={() => setType('income')}
              style={{ marginRight: Spacing.s }}
            >
              Income
            </PaperButton>
            <PaperButton
              mode={type === 'expense' ? 'contained' : 'outlined'}
              onPress={() => setType('expense')}
            >
              Expense
            </PaperButton>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.m }}>
            <TouchableOpacity
              onPress={() => setShowIconPicker(true)}
              style={{
                padding: Spacing.s,
                borderRadius: 8,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#eee',
                marginRight: Spacing.s,
              }}
            >
              <MaterialCommunityIcons name={selectedIcon} size={22} color={selectedColor} />
            </TouchableOpacity>
            <IconButton label="Icon" icon="image" onPress={() => setShowIconPicker(true)} />
            <IconButton label="Color" icon="palette" onPress={() => setShowColorPicker(true)} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <PaperButton mode="outlined" onPress={onClose} style={{ marginRight: Spacing.s }}>
              Cancel
            </PaperButton>
            <PaperButton mode="contained" onPress={handleCreateCategory}>
              Create
            </PaperButton>
          </View>
        </Card>

        <IconPicker
          visible={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          onSelect={setSelectedIcon}
        />
        <ColorPickerModal
          visible={showColorPicker}
          onClose={() => setShowColorPicker(false)}
          onSelect={setSelectedColor}
          currentColor={selectedColor}
        />
      </View>
    </Modal>
  );
}