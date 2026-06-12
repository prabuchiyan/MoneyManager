import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { TextInput as PaperInput, Button as PaperButton, Avatar } from 'react-native-paper';
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

  const COLORS = ['#4B7CF3','#FFA500','#2ECC71','#E74C3C','#9B59B6','#1ABC9C'];

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  async function load() {
    const rows = await getSources(true);
    setItems(rows);
  }

  useEffect(() => { load(); }, []);

  // 🔹 Smart icon suggestion
  function suggestIconForText(text) {
    if (!text) return 'cash';
    const t = text.toLowerCase();

    if (t.includes('bank')) return 'bank';
    if (t.includes('upi')) return 'cellphone';
    if (t.includes('card')) return 'credit-card';
    if (t.includes('wallet')) return 'wallet';

    return 'cash';
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
    <View style={{flex:1}}>

      {/* ADD CARD */}
      <Card style={{margin: Spacing.m}}>
        <Text style={{fontSize:18, marginBottom:10}}>Sources</Text>

        <PaperInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={{marginBottom:8}}
        />

        <PaperInput
          label="Initial Balance"
          value={initial}
          onChangeText={setInitial}
          keyboardType="numeric"
          mode="outlined"
          style={{marginBottom:8}}
        />

        {/* ICON + COLOR */}
        <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
          <TouchableOpacity onPress={() => setShowIconPickerAdd(true)} style={{marginRight:10}}>
            <Avatar.Icon size={32} icon={selectedIcon} style={{backgroundColor:selectedColor}} />
          </TouchableOpacity>

          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedColor(c)}
              style={{
                width:26,height:26,borderRadius:13,
                backgroundColor:c,
                marginRight:6,
                borderWidth: selectedColor===c ? 2 : 0
              }}
            />
          ))}
        </View>

        <PaperButton mode="contained" icon="plus" onPress={add}>
          Add Source
        </PaperButton>
      </Card>

      {/* LIST */}
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{padding: Spacing.m}}
        renderItem={({item}) => (
          <Card style={{marginBottom: Spacing.s}}>

            {editingId === item.id ? (

              <View>
                <PaperInput value={editName} onChangeText={setEditName} mode="outlined" style={{marginBottom:6}} />
                <PaperInput value={editInitial} onChangeText={setEditInitial} mode="outlined" keyboardType="numeric" style={{marginBottom:6}} />

                <View style={{flexDirection:'row', alignItems:'center', marginBottom:6}}>
                  <TouchableOpacity onPress={() => setShowIconPickerEdit(true)} style={{marginRight:10}}>
                    <Avatar.Icon size={28} icon={editIcon} style={{backgroundColor:editColor}} />
                  </TouchableOpacity>

                  {COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setEditColor(c)}
                      style={{
                        width:22,height:22,borderRadius:11,
                        backgroundColor:c,
                        marginRight:6,
                        borderWidth: editColor===c ? 2 : 0
                      }}
                    />
                  ))}
                </View>

                <View style={{flexDirection:'row'}}>
                  <PaperButton mode="contained" onPress={saveEdit}>Save</PaperButton>
                  <View style={{width:8}} />
                  <PaperButton mode="outlined" onPress={() => setEditingId(null)}>Cancel</PaperButton>
                </View>
              </View>

            ) : (

              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Avatar.Icon size={28} icon={item.icon || 'cash'} style={{backgroundColor:item.color || '#4B7CF3', marginRight:8}} />
                  <Text>{item.name} — ₹{item.initial_balance}</Text>
                </View>

                <View style={{flexDirection:'row'}}>
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

      {/* DIALOG */}
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

      {/* PICKERS */}
      <IconPicker visible={showIconPickerAdd} onClose={() => setShowIconPickerAdd(false)} onSelect={setSelectedIcon} />
      <IconPicker visible={showIconPickerEdit} onClose={() => setShowIconPickerEdit(false)} onSelect={setEditIcon} />

      {/* COLOR MODAL */}
      <Modal visible={showColorPickerAdd} transparent>
        <View style={{flex:1,justifyContent:'center',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <Card style={{margin:20,padding:12}}>
            <ScrollView contentContainerStyle={{flexDirection:'row',flexWrap:'wrap'}}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => { setSelectedColor(c); setShowColorPickerAdd(false); }}
                  style={{width:36,height:36,borderRadius:18,backgroundColor:c,margin:6}} />
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>

    </View>
  );
}