import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { TransactionForm } from '../src/components/TransactionForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditExpenseRoute() {
  const router = useRouter();
  const { transaction } = useLocalSearchParams();
  const expense = JSON.parse(transaction);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const updateExpense = useBudgetStore(state => state.updateExpense);
  const deleteExpense = useBudgetStore(state => state.deleteExpense);
  const isLoading = useBudgetStore(state => state.isLoading);

  const handleSave = (payload) => {
    Alert.alert(
      'Update Expense',
      'Are you sure you want to update this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            await updateExpense({ id: expense.id, ...payload });
            const err = useBudgetStore.getState().error;
            if (err) {
              Alert.alert('Error', err);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(expense.id);
            const err = useBudgetStore.getState().error;
            if (err) {
              Alert.alert('Error', err);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Expense',
          presentation: 'modal',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDelete}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color={themeColors.adaptiveRed} />
            </TouchableOpacity>
          ),
        }}
      />
      <TransactionForm
        transactionType="expense"
        initialData={expense}
        onSave={handleSave}
        isLoading={isLoading}
        onCancel={() => router.back()}
      />
    </>
  );
}
