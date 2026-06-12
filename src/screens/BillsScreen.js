import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { createBill, getBills, markBillPaid, deleteBill, updateBill } from '../services/bills';
import Card from '../components/Card';
import IconButton from '../components/IconButton';
import ConfirmDialog from '../components/ConfirmDialog';
import { Spacing } from '../components/Theme';

export default function BillsScreen() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('0');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('Are you sure you want to delete this bill?');

  async function load() {
    const rows = await getBills();
    setItems(rows);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!name) return;
    await createBill({ name, amount: parseFloat(amount) || 0 });
    setName(''); setAmount('0');
    load();
  }

  async function pay(id) {
    await markBillPaid(id);
    load();
  }

  async function remove(id) {
    await deleteBill(id);
    load();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount || 0));
  }

  async function saveEdit() {
    await updateBill(editingId, { name: editName, amount: parseFloat(editAmount) || 0, due_date: null, is_recurring: 0, recurrence_type: null, category_id: null, is_paid: 0 });
    setEditingId(null); setEditName(''); setEditAmount('0'); load();
  }

  function cancelEdit() { setEditingId(null); setEditName(''); setEditAmount('0'); }

  return (
    <View style={{flex:1}}>
      <Card style={{margin: Spacing.m}}>
        <Text style={{fontSize:18,marginBottom:8}}>Bills</Text>
        <TextInput placeholder="Name" value={name} onChangeText={setName} style={{borderWidth:1,borderColor:'#eee',padding:8,marginBottom:8}} />
        <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" style={{borderWidth:1,borderColor:'#eee',padding:8,marginBottom:8}} />
        <IconButton label="Add Bill" icon="plus" onPress={add} style={{alignSelf:'flex-start'}} />
      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{padding: Spacing.m}}
        renderItem={({item}) => (
          <Card style={{marginBottom: Spacing.s}}>
            {editingId === item.id ? (
              <View>
                <TextInput value={editName} onChangeText={setEditName} style={{borderWidth:1,borderColor:'#eee',padding:6,marginBottom:6}} />
                <TextInput value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" style={{borderWidth:1,borderColor:'#eee',padding:6,marginBottom:6}} />
                <View style={{flexDirection:'row'}}>
                  <IconButton label="Save" icon="save" onPress={saveEdit} />
                  <View style={{width:8}} />
                  <IconButton label="Cancel" icon="x" onPress={cancelEdit} />
                </View>
              </View>
            ) : (
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <Text>{item.name} — {item.amount} — Paid: {item.is_paid}</Text>
                <View style={{flexDirection:'row'}}>
                  {!item.is_paid ? <IconButton label="Mark Paid" icon="check" onPress={() => pay(item.id)} /> : null}
                  <View style={{width:8}} />
                  <IconButton label="Edit" icon="edit-2" onPress={() => startEdit(item)} />
                  <View style={{width:8}} />
                  <IconButton label="Delete" icon="trash-2" onPress={() => { setConfirmTargetId(item.id); setConfirmMessage(`Delete bill "${item.name}"?`); setConfirmVisible(true); }} />
                </View>
              </View>
            )}
          </Card>
        )}
      />

      <ConfirmDialog visible={confirmVisible} title="Delete Bill" message={confirmMessage} onCancel={() => { setConfirmVisible(false); setConfirmTargetId(null); }} onConfirm={async () => { if (confirmTargetId) { await remove(confirmTargetId); } setConfirmVisible(false); setConfirmTargetId(null); }} />
    </View>
  );
}
