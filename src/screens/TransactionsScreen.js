import React, {useEffect, useState} from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Platform } from 'react-native';
import { getTransactions, deleteTransaction, updateTransaction } from '../services/transactions';
import { getCategories } from '../services/categories';
import { getSources } from '../services/sources';
import ConfirmDialog from '../components/ConfirmDialog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, TextInput as PaperTextInput, Button as PaperButton, Chip } from 'react-native-paper';
import Card from '../components/Card';
import IconButton from '../components/IconButton';
import { Spacing } from '../components/Theme';

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

  async function load() {
    const t = await getTransactions(200);
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

  return (
    <View style={{flex:1}}>
      <Card style={{margin: Spacing.m}}>
        <IconButton label="Add Transaction" icon="plus" onPress={() => navigation.navigate('TransactionAdd')} />
      </Card>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{padding: Spacing.m}}
        renderItem={({item}) => (
          <Card style={{marginBottom: Spacing.s}}>
            {editingId === item.id ? (
              <View>
                <PaperTextInput label="Amount" value={String(editAmount)} onChangeText={(t) => { setEditAmount(t); if (editAmountError) setEditAmountError(false); }} keyboardType="numeric" mode="outlined" style={{marginBottom:8}} error={editAmountError} />
                  <View style={{borderRadius:10,overflow:'hidden',marginBottom:10}}>
                    <View style={{backgroundColor: editType==='expense' ? '#FFF6F6' : '#F6FFFA', padding:10, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                      <Text style={{color: editType==='expense' ? '#E46A6A' : '#36B37E', fontWeight:'700'}}>{editType.toUpperCase()}</Text>
                      <Text style={{fontSize:20, fontWeight:'800', color: editType==='expense' ? '#E46A6A' : '#36B37E'}}>{editAmount ? Number(editAmount).toFixed(2) : '0.00'}</Text>
                    </View>
                  </View>
                {editAmountError ? <Text style={{color:'#E46A6A', marginBottom:8}}>Enter an amount greater than 0</Text> : null}

                <View style={{flexDirection:'row', marginBottom:8}}>
                  <Chip mode="outlined" selected={editType==='expense'} onPress={() => setEditType('expense')} style={{marginRight:8}}>Expense</Chip>
                  <Chip mode="outlined" selected={editType==='income'} onPress={() => setEditType('income')}>Income</Chip>
                </View>

                <View style={{marginBottom:8}}>
                  <Text style={{marginBottom:6}}>Category</Text>
                  <TouchableOpacity onPress={() => setShowCategoryPicker(true)} style={{borderWidth:1,borderColor:'#eee',padding:10,borderRadius:8,backgroundColor:'#fff'}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <MaterialCommunityIcons name={(categories.find(x=>x.id===editCategoryId)||{}).icon || 'tag'} size={18} color={(categories.find(x=>x.id===editCategoryId)||{}).color || '#4B7CF3'} style={{marginRight:8}} />
                      <Text>{(categories.find(x=>x.id===editCategoryId)||{}).name || 'Select category'}</Text>
                    </View>
                  </TouchableOpacity>
                  <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
                    <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
                      <View style={{backgroundColor:'#fff',padding:12,borderRadius:8,maxHeight:'80%'}}>
                        <PaperTextInput label="Search" value={catSearch} onChangeText={setCatSearch} mode="outlined" style={{marginBottom:8}} />
                        <FlatList data={categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))} keyExtractor={i => String(i.id)} renderItem={({item: c}) => (
                          <TouchableOpacity onPress={() => { setEditCategoryId(c.id); setShowCategoryPicker(false); }} style={{flexDirection:'row',alignItems:'center',padding:10,borderBottomWidth:1,borderColor:'#f3f3f3', backgroundColor: editCategoryId===c.id ? '#FFF9F9' : '#fff'}}>
                            <View style={{width:36,height:36,borderRadius:18,backgroundColor:c.color || '#eee',alignItems:'center',justifyContent:'center',marginRight:12}}>
                              <MaterialCommunityIcons name={c.icon || 'tag'} size={18} color={'#fff'} />
                            </View>
                            <Text style={{fontSize:16}}>{c.name}</Text>
                          </TouchableOpacity>
                        )} />
                        <View style={{height:8}} />
                        <View style={{flexDirection:'row',justifyContent:'flex-end'}}>
                          <PaperButton mode="outlined" onPress={() => setShowCategoryPicker(false)}>Close</PaperButton>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </View>

                <View style={{marginBottom:8}}>
                  <Text style={{marginBottom:6}}>Source</Text>
                  <TouchableOpacity onPress={() => setShowSourcePicker(true)} style={{borderWidth:1,borderColor:'#eee',padding:10,borderRadius:8,backgroundColor:'#fff'}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <View style={{width:28,height:28,borderRadius:14,backgroundColor:'#eef7ff',alignItems:'center',justifyContent:'center',marginRight:8}}>
                        <MaterialCommunityIcons name={(sources.find(x=>x.id===editSourceId)||{}).icon || 'cash'} size={16} color={(sources.find(x=>x.id===editSourceId)||{}).icon_color || '#4B7CF3'} />
                      </View>
                      <Text>{(sources.find(x=>x.id===editSourceId)||{}).name || 'Select source'}</Text>
                    </View>
                  </TouchableOpacity>
                  <Modal visible={showSourcePicker} transparent animationType="slide" onRequestClose={() => setShowSourcePicker(false)}>
                    <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
                      <View style={{backgroundColor:'#fff',padding:12,borderRadius:8,maxHeight:'80%'}}>
                        <PaperTextInput label="Search" value={srcSearch} onChangeText={setSrcSearch} mode="outlined" style={{marginBottom:8}} />
                        <FlatList data={sources.filter(s => s.name.toLowerCase().includes(srcSearch.toLowerCase()))} keyExtractor={i => String(i.id)} renderItem={({item: s}) => (
                          <TouchableOpacity onPress={() => { setEditSourceId(s.id); setShowSourcePicker(false); }} style={{flexDirection:'row',alignItems:'center',padding:10,borderBottomWidth:1,borderColor:'#f3f3f3', backgroundColor: editSourceId===s.id ? '#F7FBFF' : '#fff'}}>
                            <View style={{width:36,height:36,borderRadius:18,backgroundColor:'#eef7ff',alignItems:'center',justifyContent:'center',marginRight:12}}>
                              <MaterialCommunityIcons name={s.icon || 'cash'} size={18} color={(s.icon_color) || '#4B7CF3'} />
                            </View>
                            <Text style={{fontSize:16}}>{s.name}</Text>
                          </TouchableOpacity>
                        )} />
                        <View style={{height:8}} />
                        <View style={{flexDirection:'row',justifyContent:'flex-end'}}>
                          <PaperButton mode="outlined" onPress={() => setShowSourcePicker(false)}>Close</PaperButton>
                        </View>
                      </View>
                    </View>
                  </Modal>
                </View>

                <PaperTextInput label="Notes" value={editNotes} onChangeText={(t) => { setEditNotes(t); if (editNotesError) setEditNotesError(false); }} mode="outlined" multiline style={{marginBottom:8}} error={editNotesError} />
                {editNotesError ? <Text style={{color:'#E46A6A', marginBottom:8}}>Notes are required</Text> : null}

                <View style={{marginBottom:8}}>
                  <Text style={{marginBottom:6}}>Date & Time</Text>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                    <Text>{new Date(editDate).toLocaleString()}</Text>
                    <PaperButton mode="outlined" onPress={() => { setEditPickerMode('date'); setShowEditDatePicker(true); }}>Pick Date/Time</PaperButton>
                  </View>
                </View>

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
                    const [y, m, d, h, min] = [dt.getFullYear(), dt.getMonth()+1, dt.getDate(), dt.getHours(), dt.getMinutes()];
                    return (
                      <Modal visible={showEditDatePicker} transparent animationType="slide" onRequestClose={() => setShowEditDatePicker(false)}>
                        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
                          <View style={{backgroundColor:'#fff',padding:12,borderRadius:8}}>
                            <Manual year={y} month={m} day={d} hour={h} minute={min} onChange={(ny,nm,nd,nh,nmin) => setEditDate(new Date(ny,nm-1,nd,nh,nmin).toISOString())} onClose={() => setShowEditDatePicker(false)} />
                          </View>
                        </View>
                      </Modal>
                    );
                  })()
                )}

                <View style={{flexDirection:'row'}}>
                  <PaperButton mode="contained" onPress={async () => {
                    const val = parseFloat(editAmount);
                    if (!editAmount || isNaN(val) || val === 0) { setEditAmountError(true); return; }
                    if (!editNotes || !editNotes.trim()) { setEditNotesError(true); return; }
                    await updateTransaction(item.id, { amount: val, type: editType, category_id: editCategoryId, source_id: editSourceId, notes: editNotes, date: editDate });
                    setEditingId(null); load();
                  }} style={{backgroundColor: editType==='expense' ? '#E46A6A' : '#36B37E'}} labelStyle={{color:'#fff'}}>Save</PaperButton>
                  <View style={{width:8}} />
                  <PaperButton mode="outlined" onPress={() => setEditingId(null)}>Cancel</PaperButton>
                </View>
              </View>
            ) : (
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                  {(() => {
                    const cat = categories.find(x => x.id === item.category_id);
                    if (cat) return <Avatar.Icon size={32} icon={cat.icon || 'tag'} style={{backgroundColor: cat.color || '#4B7CF3', marginRight:8}} />;
                    return <Avatar.Icon size={32} icon={'cash'} style={{backgroundColor:'#eee', marginRight:8}} />;
                  })()}
                  <View>
                    <Text style={{fontWeight:'600'}}>{item.type} — {Number(item.amount).toFixed(2)}</Text>
                    <Text style={{color:'#666', marginTop:4}}>{item.date}</Text>
                  </View>
                </View>
                <View style={{flexDirection:'row'}}>
                  <IconButton label="Edit" icon="edit-2" onPress={() => { setEditingId(item.id); setEditAmount(String(item.amount)); setEditType(item.type||'expense'); setEditCategoryId(item.category_id||null); setEditSourceId(item.source_id||null); setEditNotes(item.notes||''); setEditDate(item.date || new Date().toISOString()); }} />
                  <View style={{width:8}} />
                  <IconButton label="Delete" icon="trash-2" onPress={() => { setConfirmTargetId(item.id); setConfirmMessage(`Delete transaction ${item.type} ${Number(item.amount).toFixed(2)}?`); setConfirmVisible(true); }} />
                </View>
              </View>
            )}
          </Card>
        )}
      />

      <ConfirmDialog visible={confirmVisible} title="Delete Transaction" message={confirmMessage} onCancel={() => { setConfirmVisible(false); setConfirmTargetId(null); }} onConfirm={async () => { if (confirmTargetId) { await deleteTransaction(confirmTargetId); } setConfirmVisible(false); setConfirmTargetId(null); load(); }} />
    </View>
  );
}
