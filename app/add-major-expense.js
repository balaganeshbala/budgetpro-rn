import { Stack, useRouter } from 'expo-router';
import { MajorExpenseForm } from '../src/components/MajorExpenseForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddMajorExpenseRoute() {
    const router = useRouter();
    const addMajorExpense = useBudgetStore(state => state.addMajorExpense);
    const isLoading = useBudgetStore(state => state.majorExpensesLoading);

    const handleSave = async (payload) => {
        await addMajorExpense(payload);
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Add Major Expense', presentation: 'modal' }} />
            <MajorExpenseForm
                onSave={handleSave}
                isLoading={isLoading}
                onCancel={() => router.back()}
            />
        </>
    );
}
