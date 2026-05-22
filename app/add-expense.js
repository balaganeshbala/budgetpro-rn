import { useRouter } from 'expo-router';
import { TransactionForm } from '../src/components/TransactionForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddExpenseRoute() {
  const router = useRouter();
  const addExpense = useBudgetStore((state) => state.addExpense);
  const isLoading = useBudgetStore((state) => state.isLoading);

  const handleSave = async (payload) => {
    await addExpense(payload);
    if (!useBudgetStore.getState().error) {
      router.back();
    }
  };

  return (
    <TransactionForm 
      transactionType="expense"
      onSave={handleSave}
      isLoading={isLoading}
      onCancel={() => router.back()}
    />
  );
}
