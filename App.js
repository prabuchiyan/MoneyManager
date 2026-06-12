import React, {useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import TransactionAddScreen from './src/screens/TransactionAddScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import SourcesScreen from './src/screens/SourcesScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import BillsScreen from './src/screens/BillsScreen';
import { initDB } from './src/database/init';
import { runRecurringScheduler } from './src/services/bills';
import { Provider as PaperProvider, DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from './src/components/Theme';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      // Ensure icon fonts are loaded on web/native before UI renders
      try {
        if (MaterialCommunityIcons && MaterialCommunityIcons.loadFont) await MaterialCommunityIcons.loadFont();
        if (Feather && Feather.loadFont) await Feather.loadFont();
      } catch (e) { console.warn('Icon font load failed', e); }
      await initDB();
      try { await runRecurringScheduler(); } catch (e) { console.warn('Scheduler error', e); }
    })();
  }, []);

  return (
    <PaperProvider theme={{
      ...PaperDefaultTheme,
      colors: { ...PaperDefaultTheme.colors, primary: Colors.primary, accent: Colors.accent }
    }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Transactions" component={TransactionsScreen} />
          <Stack.Screen name="TransactionAdd" component={TransactionAddScreen} options={{ title: 'Add Transaction' }} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="Sources" component={SourcesScreen} />
          <Stack.Screen name="Budgets" component={BudgetsScreen} />
          <Stack.Screen name="Bills" component={BillsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
