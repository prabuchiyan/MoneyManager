import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { createSource, updateSource } from '../services/sources';
import IconPicker from './IconPicker';
import ColorPickerModal from './ColorPickerModal';
import IconButton from './IconButton';

export default function SourceCreateModal({ visible, onClose, onSave, editData }) {

  const [name, setName] = useState('');
  const [initial, setInitial] = useState('0');

  const [icon, setIcon] = useState('cash');
  const [color, setColor] = useState('#4B7CF3');

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.name || '');
      setInitial(String(editData.initial_balance || 0));
      setIcon(editData.icon || 'cash');
      setColor(editData.color || '#4B7CF3');
    } else {
      setName('');
      setInitial('0');
      setIcon('cash');
      setColor('#4B7CF3');
    }
  }, [editData]);

  async function handleSave() {
    if (!name) return;

    const payload = {
      name,
      initial_balance: parseFloat(initial) || 0,
      icon,
      color,
      is_active: 1
    };

    if (editData) {
      await updateSource(editData.id, payload);
    } else {
      await createSource(payload);
    }

    onSave();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Name */}
          <TextInput
            label="Source Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          {/* Balance */}
          <TextInput
            label="Initial Balance"
            value={initial}
            onChangeText={setInitial}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          {/* Icon + Color Row */}
          <View style={styles.iconRow}>

            <TouchableOpacity
              onPress={() => setShowIconPicker(true)}
              style={[styles.iconBox, { backgroundColor: color + '20' }]}
            >
              <MaterialCommunityIcons name={icon} size={24} color={color} />
            </TouchableOpacity>

            <IconButton
              label="Icon"
              icon="image"
              onPress={() => setShowIconPicker(true)}
            />

            <IconButton
              label="Color"
              icon="droplet"
              onPress={() => setShowColorPicker(true)}
            />

          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button onPress={onClose}>Cancel</Button>
            <Button mode="contained" onPress={handleSave}>
              {editData ? 'Update' : 'Add'}
            </Button>
          </View>

        </View>
      </View>

      {/* Pickers */}
      <IconPicker
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={(i) => setIcon(i)}
      />

      <ColorPickerModal
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onSelect={setColor}
        currentColor={color}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  input: {
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});