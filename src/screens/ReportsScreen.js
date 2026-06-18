import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Chip } from 'react-native-paper';
import { getTransactions } from '../services/transactions';
import { getCategories } from '../services/categories';
import { groupTransactions } from '../services/reports';
import Card from '../components/Card';
import { Colors, Spacing } from '../components/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReportsScreen() {
  const [transactions, setTransactions] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [mode, setMode] = useState('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tx, cats] = await Promise.all([
          getTransactions(500),
          getCategories(true)
        ]);
        const cmap = {};
        cats.forEach(c => { cmap[c.id] = c; });
        setCategoriesMap(cmap);
        setTransactions(tx);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const reportData = useMemo(() => {
    return groupTransactions(transactions, mode);
  }, [transactions, mode]);

  const maxAmount = useMemo(() => {
    if (!reportData || reportData.length === 0) return 100;
    const points = reportData.map(d => Math.max(d.income || 0, d.expense || 0));
    const max = Math.max(...points);
    return max > 0 ? max : 100;
  }, [reportData]);

  const formatLabel = (label) => {
    if (mode === 'daily') return label.substring(5); // MM-DD
    if (mode === 'monthly') {
      const [year, month] = label.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month, 10) - 1]}`;
    }
    if (mode === 'weekly') return `Wk ${label.substring(8, 10)}`;
    return label;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {['daily', 'weekly', 'monthly', 'yearly'].map((m) => (
          <Chip
            key={m}
            mode="outlined"
            selected={mode === m}
            onPress={() => setMode(m)}
            style={[styles.chip, mode === m && { borderColor: Colors.primary, backgroundColor: '#e6f7ff' }]}
            selectedColor={Colors.primary}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </Chip>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Income vs Expense Chart</Text>
          {reportData.length === 0 ? (
            <Text style={styles.emptyText}>No data available for the selected period</Text>
          ) : (
            <View style={styles.chartOuterRow}>
              {reportData.map((data, idx) => (
                <View key={idx} style={styles.chartColumn}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, styles.incomeBar, { height: `${Math.max((data.income / maxAmount) * 100, 2)}%` }]} />
                    <View style={[styles.bar, styles.expenseBar, { height: `${Math.max((data.expense / maxAmount) * 100, 2)}%` }]} />
                  </View>
                  <Text style={styles.axisLabel} numberOfLines={1}>
                    {formatLabel(data.label)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#36B37E' }]} /><Text style={styles.legendText}>Income</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#E46A6A' }]} /><Text style={styles.legendText}>Expense</Text></View>
          </View>
        </Card>

        {reportData.map((data, idx) => (
          <Card key={idx} style={styles.itemCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.periodLabel}>{data.label}</Text>
              <Text style={[styles.netBalance, { color: data.balance >= 0 ? '#36B37E' : '#E46A6A' }]}>
                Net: ₹{data.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.incomeText}>+ ₹{data.income.toLocaleString('en-IN')}</Text>
              <Text style={styles.expenseText}>- ₹{data.expense.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.categoryBreakdown}>
              {Object.entries(data.categories).map(([cid, totals]) => {
                const cat = categoriesMap[cid] || { name: 'Uncategorized', icon: 'help-circle', color: '#999' };
                const isExpense = totals.expense > 0;
                return (
                  <View key={cid} style={styles.catRow}>
                    <View style={styles.catInfo}>
                      <MaterialCommunityIcons 
                        name={cat.icon || 'tag'} 
                        size={16} 
                        color={cat.color} 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={styles.catName}>{cat.name}</Text>
                    </View>
                    <Text style={[styles.catAmount, { color: isExpense ? '#E46A6A' : '#36B37E' }]}>
                      {isExpense ? '-' : '+'}₹{(isExpense ? totals.expense : totals.income).toLocaleString('en-IN')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.m },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  chip: { flex: 1, marginHorizontal: 2, alignItems: 'center', justifyContent: 'center' },
  chartCard: { padding: 16, marginBottom: 16, alignItems: 'center', borderRadius: 16 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  chartOuterRow: { flexDirection: 'row', alignItems: 'flex-end', height: 160, justifyContent: 'space-around', width: '100%' },
  chartColumn: { alignItems: 'center', flex: 1 },
  barContainer: { flexDirection: 'row', alignItems: 'flex-end', height: '85%', justifyContent: 'center', width: '100%' },
  bar: { width: 8, borderRadius: 4, marginHorizontal: 1.5 },
  incomeBar: { backgroundColor: '#36B37E' },
  expenseBar: { backgroundColor: '#E46A6A' },
  axisLabel: { fontSize: 11, color: Colors.muted, marginTop: 6, textAlign: 'center' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.text, fontWeight: '500' },
  emptyText: { color: Colors.muted, marginVertical: 40 },
  itemCard: { marginBottom: 10, padding: 14, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#f5f5f5', paddingBottom: 8 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  netBalance: { fontSize: 14, fontWeight: '800' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  incomeText: { fontSize: 13, color: '#36B37E', fontWeight: '600' },
  expenseText: { fontSize: 13, color: '#E46A6A', fontWeight: '600' },
  categoryBreakdown: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f9f9f9' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catInfo: { flexDirection: 'row', alignItems: 'center' },
  catName: { fontSize: 12, color: Colors.text },
  catAmount: { fontSize: 12, fontWeight: '600' },
});
