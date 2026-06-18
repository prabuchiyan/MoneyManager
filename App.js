import React, { useEffect, useState } from 'react';
import { Text, View, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ErrorBoundary from './src/screens/ErrorBoundary';
import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import TransactionAddScreen from './src/screens/TransactionAddScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SourcesDashboard from './src/screens/SourcesDashboard';
import SourcesScreen from './src/screens/SourcesScreen';
import SourcesDetails from './src/screens/SourcesDetails';
import BudgetsScreen from './src/screens/BudgetsScreen';
import BillsScreen from './src/screens/BillsScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import { initDB } from './src/database/init';
import { runBillMaintenance } from './src/services/bills';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from './src/components/Theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load icons
        if (MaterialCommunityIcons?.loadFont) {
          await MaterialCommunityIcons.loadFont();
        }
        if (Feather?.loadFont) {
          await Feather.loadFont();
        }

        // Init DB
        await initDB();

        // Run maintenance
        try {
          await runBillMaintenance();
        } catch (e) {
          console.warn('Bill maintenance error', e);
        }

        // ✅ ONLY after everything is ready
        setReady(true);

      } catch (e) {
        console.error('App init failed:', e);
      }
    })();
  }, []);

  // 🚨 BLOCK UI until ready
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Image 
          source={require('./assets/logo.png')} 
          style={{ width: 100, height: 100, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text>Prabuchiyan...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <PaperProvider
        theme={{
          ...PaperDefaultTheme,
          colors: {
            ...PaperDefaultTheme.colors,
            primary: Colors.primary,
            accent: Colors.accent
          }
        }}
      >
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={HomeScreen} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            <Stack.Screen name="TransactionAdd" component={TransactionAddScreen} options={{ title: 'Add Transaction' }} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="SourcesDashboard" component={SourcesDashboard} />
            <Stack.Screen name="Sources" component={SourcesScreen} />
            <Stack.Screen name="SourcesDetails" component={SourcesDetails} />
            <Stack.Screen name="Budgets" component={BudgetsScreen} />
            <Stack.Screen name="Bills" component={BillsScreen} options={{ title: 'Bills' }} />
            <Stack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: 'Bill Details' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </ErrorBoundary>
  );
}