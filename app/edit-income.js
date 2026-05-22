import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { TransactionForm } from '../src/components/TransactionForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditIncomeRoute() {
  const router = useRouter();
  const { transaction } = useLocalSearchParams();
  const income = JSON.parse(transaction);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeColors = colors[scheme];

  const updateIncome = useBudgetStore(state => state.updateIncome);
  const deleteIncome = useBudgetStore(state => state.deleteIncome);
  const isLoading = useBudgetStore(state => state.isLoading);

  const handleSave = (payload) => {
    Alert.alert(
      'Update Income',
      'Are you sure you want to update this income?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            await updateIncome({ id: income.id, ...payload });
            if (!useBudgetStore.getState().error) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteIncome(income.id);
            if (!useBudgetStore.getState().error) {
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
          title: 'Edit Income',
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
        transactionType="income"
        initialData={income}
        onSave={handleSave}
        isLoading={isLoading}
        onCancel={() => router.back()}
      />
    </>
  );
}
