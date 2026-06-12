import React, {useState, useEffect} from 'react';
import { View, TouchableOpacity, ScrollView, Modal, Text, Platform } from 'react-native';
import { createTransaction } from '../services/transactions';
import { getCategories } from '../services/categories';
import { getSources } from '../services/sources';
import { TextInput as PaperTextInput, Button as PaperButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TransactionForm({ onCreated, onCancel }) {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [type, setType] = useState('expense');
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [sourceId, setSourceId] = useState(null);
  const [date, setDate] = useState(new Date().toISOString());
  const [notes, setNotes] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [srcSearch, setSrcSearch] = useState('');
  const [pickerMode, setPickerMode] = useState('date');

  useEffect(() => {
    (async () => {
      const cats = await getCategories(true);
      setCategories(cats);
      const src = await getSources(true);
      setSources(src);
      if (cats.length && !categoryId) setCategoryId(cats[0].id);
      if (src.length && !sourceId) setSourceId(src[0].id);
    })();
  }, []);

  async function submit() {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val === 0) {
      setAmountError(true);
      return;
    }
    const id = await createTransaction({ type, amount: val, category_id: categoryId, source_id: sourceId, date, notes });
    if (onCreated) onCreated(id);
    setAmount(''); setNotes('');
    setAmountError(false);
  }

  const accent = type === 'expense' ? '#E46A6A' : '#36B37E';

  return (
    <ScrollView contentContainerStyle={{padding:16}}>
      <View style={{borderRadius:12,overflow:'hidden',marginBottom:12}}>
        <View style={{backgroundColor: type==='expense' ? '#FFF2F2' : '#F1FFF6', padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
          <View>
            <Text style={{color:accent, fontSize:14, fontWeight:'700', textTransform:'uppercase'}}>{type}</Text>
            <Text style={{fontSize:22, fontWeight:'800', color:accent}}>{amount ? (Number(amount).toFixed(2)) : '0.00'}</Text>
          </View>
          <View style={{flexDirection:'row',alignItems:'center'}}>
            <View style={{alignItems:'center',marginRight:12}}>
              <MaterialCommunityIcons name={(categories.find(x=>x.id===categoryId)||{}).icon || 'tag'} size={26} color={(categories.find(x=>x.id===categoryId)||{}).color || '#4B7CF3'} />
              <Text style={{fontSize:12}}>{(categories.find(x=>x.id===categoryId)||{}).name || 'Category'}</Text>
            </View>
            <View style={{alignItems:'center'}}>
              <MaterialCommunityIcons name={(sources.find(x=>x.id===sourceId)||{}).icon || 'cash'} size={26} color={(sources.find(x=>x.id===sourceId)||{}).icon_color || '#4B7CF3'} />
              <Text style={{fontSize:12}}>{(sources.find(x=>x.id===sourceId)||{}).name || 'Source'}</Text>
            </View>
          </View>
        </View>
      </View>

      <PaperTextInput label="Amount" value={amount} onChangeText={(t) => { setAmount(t); if (amountError) setAmountError(false); }} keyboardType="numeric" mode="outlined" style={{marginBottom:12, fontSize:20}} error={amountError} contentStyle={{fontSize:24}} />
      {amountError ? <Text style={{color:'#E46A6A', marginBottom:8}}>Enter an amount greater than 0</Text> : null}
      <View style={{flexDirection:'row', marginBottom:12}}>
        <Chip mode="outlined" selected={type==='expense'} onPress={() => setType('expense')} style={{marginRight:8, borderColor: type==='expense' ? accent : undefined}}>Expense</Chip>
        <Chip mode="outlined" selected={type==='income'} onPress={() => setType('income')} style={{borderColor: type==='income' ? accent : undefined}}>Income</Chip>
      </View>

      <View style={{marginBottom:12}}>
        <PaperTextInput label="Date & Time" value={date} editable={false} onPressIn={() => { setPickerMode('date'); setShowDateTimePicker(true); }} mode="outlined" style={{marginBottom:8}} />
        <View style={{flexDirection:'row'}}>
          <PaperButton onPress={() => setDate(new Date().toISOString())}>Now</PaperButton>
        </View>
      </View>

      <View style={{marginBottom:12}}>
        <Text style={{marginBottom:6, color:'#666'}}>Category</Text>
        <TouchableOpacity onPress={() => setShowCategoryPicker(true)} activeOpacity={0.8} style={{borderWidth:1,borderColor:'#eee',padding:12,borderRadius:8,backgroundColor:'#fff',flexDirection:'row',alignItems:'center'}}>
          <MaterialCommunityIcons name={(categories.find(x=>x.id===categoryId)||{}).icon || 'tag'} size={20} color={(categories.find(x=>x.id===categoryId)||{}).color || '#4B7CF3'} style={{marginRight:10}} />
          <Text style={{fontSize:16}}>{(categories.find(x=>x.id===categoryId)||{}).name||'Select category'}</Text>
        </TouchableOpacity>
        <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
            <View style={{backgroundColor:'#fff',padding:12,borderRadius:8,maxHeight:'80%'}}>
              <PaperTextInput label="Search" value={catSearch} onChangeText={setCatSearch} mode="outlined" style={{marginBottom:8}} />
              <ScrollView>
                {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(c => (
                  <TouchableOpacity key={c.id} onPress={() => { setCategoryId(c.id); setShowCategoryPicker(false); }} style={{flexDirection:'row',alignItems:'center',padding:10,borderBottomWidth:1,borderColor:'#f3f3f3', backgroundColor: categoryId===c.id ? '#FFF9F9' : '#fff'}}>
                    <View style={{width:36,height:36,borderRadius:18,backgroundColor:c.color || '#eee',alignItems:'center',justifyContent:'center',marginRight:12}}>
                      <MaterialCommunityIcons name={c.icon || 'tag'} size={18} color={'#fff'} />
                    </View>
                    <Text style={{fontSize:16}}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{height:8}} />
              <PaperButton mode="outlined" onPress={() => setShowCategoryPicker(false)}>Close</PaperButton>
            </View>
          </View>
        </Modal>
      </View>

      <View style={{marginBottom:12}}>
        <Text style={{marginBottom:6, color:'#666'}}>Source</Text>
        <TouchableOpacity onPress={() => setShowSourcePicker(true)} activeOpacity={0.8} style={{borderWidth:1,borderColor:'#eee',padding:12,borderRadius:8,backgroundColor:'#fff',flexDirection:'row',alignItems:'center'}}>
          <View style={{width:36,height:36,borderRadius:18,backgroundColor:'#f0f4ff',alignItems:'center',justifyContent:'center',marginRight:10}}>
            <MaterialCommunityIcons name={(sources.find(x=>x.id===sourceId)||{}).icon || 'cash'} size={18} color={(sources.find(x=>x.id===sourceId)||{}).icon_color || '#4B7CF3'} />
          </View>
          <Text style={{fontSize:16}}>{(sources.find(x=>x.id===sourceId)||{}).name||'Select source'}</Text>
        </TouchableOpacity>
        <Modal visible={showSourcePicker} transparent animationType="slide" onRequestClose={() => setShowSourcePicker(false)}>
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
            <View style={{backgroundColor:'#fff',padding:12,borderRadius:8,maxHeight:'80%'}}>
              <PaperTextInput label="Search" value={srcSearch} onChangeText={setSrcSearch} mode="outlined" style={{marginBottom:8}} />
              <ScrollView>
                {sources.filter(s => s.name.toLowerCase().includes(srcSearch.toLowerCase())).map(s => (
                  <TouchableOpacity key={s.id} onPress={() => { setSourceId(s.id); setShowSourcePicker(false); }} style={{flexDirection:'row',alignItems:'center',padding:10,borderBottomWidth:1,borderColor:'#f3f3f3', backgroundColor: sourceId===s.id ? '#F7FBFF' : '#fff'}}>
                    <View style={{width:36,height:36,borderRadius:18,backgroundColor:'#eef7ff',alignItems:'center',justifyContent:'center',marginRight:12}}>
                      <MaterialCommunityIcons name={s.icon || 'cash'} size={18} color={(s.icon_color) || '#4B7CF3'} />
                    </View>
                    <Text style={{fontSize:16}}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{height:8}} />
              <PaperButton mode="outlined" onPress={() => setShowSourcePicker(false)}>Close</PaperButton>
            </View>
          </View>
        </Modal>
      </View>

      <PaperTextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline style={{marginBottom:12}} />

      <View style={{flexDirection:'row',alignItems:'center'}}>
        <PaperButton mode="contained" onPress={submit} style={{backgroundColor: accent}} labelStyle={{color:'#fff'}}>
          Save
        </PaperButton>
        <View style={{width:12}} />
        <PaperButton mode="outlined" onPress={() => { if (onCancel) onCancel(); else { setAmount(''); setNotes(''); } }}>Cancel</PaperButton>
        <View style={{width:12}} />
        <PaperButton mode="outlined" onPress={() => setShowDateTimePicker(true)}>Pick Date/Time</PaperButton>
      </View>

      {/* Native DateTimePicker usage with fallback modal for platforms without library */}
      {showDateTimePicker && (
        (() => {
          // Prefer native datetimepicker only on native platforms; on web use the ManualDateTimePicker fallback
          if (Platform.OS !== 'web') {
            try {
              // Try to use community datetimepicker if available
              // eslint-disable-next-line global-require
              const DateTimePicker = require('@react-native-community/datetimepicker').default;
              return (
                <DateTimePicker
                  value={new Date(date)}
                  mode={pickerMode}
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selected) => {
                    // event may be undefined on some platforms
                    const evType = event && (event.type || event.nativeEvent?.action);
                    if (Platform.OS === 'android') {
                      // user dismissed
                      if (evType === 'dismissed' || evType === 'dismiss') {
                        setShowDateTimePicker(false);
                        setPickerMode('date');
                        return;
                      }
                      // user picked a date/time
                      if (pickerMode === 'date') {
                        const picked = selected || new Date();
                        const prev = new Date(date);
                        // preserve previous time
                        picked.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                        setDate(picked.toISOString());
                        // open time picker next
                        setShowDateTimePicker(false);
                        setPickerMode('time');
                        setTimeout(() => setShowDateTimePicker(true), 50);
                      } else {
                        const picked = selected || new Date();
                        const prev = new Date(date);
                        prev.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
                        setDate(prev.toISOString());
                        setShowDateTimePicker(false);
                        setPickerMode('date');
                      }
                    } else {
                      // iOS behavior
                      if (selected) setDate((selected).toISOString());
                      setShowDateTimePicker(false);
                      setPickerMode('date');
                    }
                  }}
                />
              );
            } catch (e) {
              // fall through to manual picker
            }
          }

          // Fallback manual picker for web or if native picker not available
          return (
            <Modal visible={showDateTimePicker} transparent animationType="slide" onRequestClose={() => setShowDateTimePicker(false)}>
              <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',padding:20}}>
                <View style={{backgroundColor:'#fff',padding:12,borderRadius:8}}>
                  <Text style={{fontWeight:'600',marginBottom:8}}>Pick Date / Time</Text>
                  {(() => {
                    const dt = new Date(date || new Date().toISOString());
                    const [y, m, d, h, min] = [dt.getFullYear(), dt.getMonth()+1, dt.getDate(), dt.getHours(), dt.getMinutes()];
                    const Manual = require('../components/ManualDateTimePicker').default;
                    return (
                      <Manual
                        year={y} month={m} day={d} hour={h} minute={min}
                        onChange={(ny, nm, nd, nh, nmin) => {
                          const ndt = new Date(ny, nm-1, nd, nh, nmin);
                          setDate(ndt.toISOString());
                        }}
                        onClose={() => setShowDateTimePicker(false)}
                      />
                    );
                  })()}
                </View>
              </View>
            </Modal>
          );
        })()
      )}
    </ScrollView>
  );
}
