import { useRouter } from 'expo-router';
import { TransactionForm } from '../components/TransactionForm';
import { useBudgetStore } from '../store/useBudgetStore';

export default function AddIncomeRoute() {
  const router = useRouter();
  const addIncome = useBudgetStore((state) => state.addIncome);
  const isLoading = useBudgetStore((state) => state.isLoading);

  const handleSave = async (payload) => {
    await addIncome(payload);
    if (!useBudgetStore.getState().error) {
      router.back();
    }
  };

  return (
    <TransactionForm 
      transactionType="income"
      onSave={handleSave}
      isLoading={isLoading}
      onCancel={() => router.back()}
    />
  );
}
