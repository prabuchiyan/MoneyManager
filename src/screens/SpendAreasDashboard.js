import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getCategorySpending, getSourceBalances } from '../services/reports';
import { getBudgetsWithRemaining } from '../services/budgets';
import { getTransactions } from '../services/transactions';
import { getCategories } from '../services/categories';
import { Avatar } from 'react-native-paper';
import Card from '../components/Card';
import { Colors, Spacing } from '../components/Theme';

function CategoryDonut({ data = [], categoriesMap = {} }) {
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  let cumulative = 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {data.map((d, i) => {
          const value = Number(d.amount || 0);
          const percent = total > 0 ? value / total : 0;
          const cat = categoriesMap[d.category_id] || {};
          const color = cat.color || '#eee';

          const strokeDasharray = `${circumference * percent} ${circumference}`;
          const rotation = (cumulative / total) * 360;

          cumulative += value;

          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              rotation={rotation - 90}
              originX={size / 2}
              originY={size / 2}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>

      {/* CENTER TEXT */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', fontSize: 14 }}>Total Spend</Text>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>
          ₹{total.toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [topCategories, setTopCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});

  async function load() {
    try {
      const catsAll = await getCategories(true);
      const cmap = {};
      catsAll.forEach(c => { cmap[c.id] = c; });
      setCategoriesMap(cmap);
    } catch (e) {
      console.error('Error loading categories:', e);
    }
    const cats = await getCategorySpending();
    setTopCategories(cats);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const totalSpend = topCategories.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.m,
          paddingBottom: 120
        }}
      >
        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>
            Spend Areas
          </Text>

          {topCategories.length ? (
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <CategoryDonut data={topCategories} categoriesMap={categoriesMap} />
            </View>
          ) : (
            <Text style={{ color: Colors.muted }}>No data</Text>
          )}

          {topCategories.map(c => {
            const cat = categoriesMap[c.category_id] || {};
            const color = cat.color || '#4B7CF3';
            const icon = cat.icon || 'tag';

            const amount = Number(c.amount || 0);
            const percent = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('CategoriesDetails', {
                  categoryId: c.category_id,
                  categoryName: c.category_name
                })}
              >
                <View key={c.category_id}
                  style={{ marginBottom: 12 }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Avatar.Icon
                        size={34}
                        icon={icon}
                        style={{
                          backgroundColor: color,
                          marginRight: 10
                        }}
                        color="#fff"
                      />

                      <Text style={{ color: Colors.text, fontWeight: '500' }}>
                        {c.category_name}
                      </Text>
                    </View>
                    <Text style={{ color: '#E46A6A', fontWeight: '600' }}>
                      ₹{amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: '#eee',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}
                  >
                    <View
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        backgroundColor: color
                      }}
                    />
                  </View>

                </View>
              </TouchableOpacity>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}
