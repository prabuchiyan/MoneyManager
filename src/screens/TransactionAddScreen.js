import React from 'react';
import { View } from 'react-native';
import TransactionForm from '../components/TransactionForm';
import { Spacing } from '../components/Theme';
import Card from '../components/Card';

export default function TransactionAddScreen({ navigation }) {
  return (
    <View style={{flex:1}}>
      <Card style={{margin: Spacing.m}}>
        <TransactionForm onCreated={() => navigation.goBack()} onCancel={() => navigation.goBack()} />
      </Card>
    </View>
  );
}
