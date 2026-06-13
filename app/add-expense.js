import { useLocalSearchParams, useRouter } from 'expo-router';
import { TransactionForm } from '../src/components/TransactionForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddExpenseRoute() {
  const router = useRouter();
  const { cat } = useLocalSearchParams();
  const addExpense = useBudgetStore((state) => state.addExpense);
  const isLoading = useBudgetStore((state) => state.isLoading);

  const handleSave = async (payload) => {
    await addExpense(payload);
  };

  return (
    <TransactionForm
      transactionType="expense"
      initialCategory={cat || null}
      onSave={handleSave}
      isLoading={isLoading}
      onCancel={() => router.back()}
    />
  );
}
