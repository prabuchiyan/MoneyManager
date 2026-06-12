import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { TextInput as PaperInput, Button, Avatar } from 'react-native-paper';
import { createBudget, getBudgetsForMonth, updateBudget } from '../services/budgets';
import events from '../services/events';
import Card from '../components/Card';
import { Spacing } from '../components/Theme';

export default function BudgetsScreen({ route, navigation }) {
  const [limit, setLimit] = useState('');
  const [currentBudgetId, setCurrentBudgetId] = useState(null);

  async function load() {
    const rows = await getBudgetsForMonth();
    // prefer a general budget (category_id null), otherwise take first
    const general = rows.find(r => r.category_id == null) || rows[0];
    if (general) {
      setCurrentBudgetId(general.id);
      setLimit(String(general.monthly_limit || ''));
    } else {
      setCurrentBudgetId(null);
      setLimit('');
    }
  }

  useEffect(() => { load(); }, []);

  async function setNow() {
    const value = parseFloat(limit) || 0;
    if (currentBudgetId) {
      await updateBudget(currentBudgetId, { category_id: null, monthly_limit: value, month: null });
      events.emit('budgetsChanged', currentBudgetId);
    } else {
      const id = await createBudget({ monthly_limit: value, category_id: null, month: null });
      events.emit('budgetsChanged', id);
    }
    // go back to home after setting
    await load();
    if (typeof navigation !== 'undefined' && navigation) {
      navigation.navigate('Home');
    }
  }

  return (
    <View style={{flex:1}}>
      <Card style={{margin: Spacing.m, paddingVertical: 28}}>
        <View style={{alignItems:'center'}}>
          <Avatar.Icon size={56} icon="cash" style={{backgroundColor:'#E8F7EF', marginBottom:12}} />
          <Text style={{fontSize:22,fontWeight:'800',marginBottom:6}}>Monthly Budget</Text>
          <Text style={{color:'#666',textAlign:'center',maxWidth:360,marginBottom:16}}>One simple box — set a monthly spending limit and tap Set Now.</Text>

          <View style={{width:'92%', maxWidth:520, alignItems:'center'}}>
            <View style={{width:'100%', backgroundColor:'#F6FBF7', borderRadius:12, paddingVertical:18, paddingHorizontal:16, alignItems:'center', marginBottom:12, borderWidth:1, borderColor:'#E6F4EA'}}>
              <Text style={{color:'#2E7D32', fontSize:14, fontWeight:'700', marginBottom:6}}>Preview</Text>
              <Text style={{fontSize:28, fontWeight:'900', color:'#1B5E20'}}>₹ {limit ? Number(limit).toLocaleString('en-IN') : '0'}</Text>
            </View>

            <PaperInput
              label="Monthly limit"
              mode="outlined"
              value={limit}
              keyboardType="numeric"
              onChangeText={setLimit}
              placeholder="e.g. 50,000"
              style={{backgroundColor:'white', width:'100%'}}
              theme={{ colors: { primary: '#36B37E' } }}
              outlineColor="#eee"
            />

            <Button mode="contained" onPress={setNow} style={{marginTop:18, paddingVertical:12, borderRadius:10, width:'100%'}} contentStyle={{paddingVertical:6}}>
              Set Now
            </Button>

            <Text style={{color:'#999', fontSize:12, marginTop:10, textAlign:'center'}}>This will create or update your general monthly budget.</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
