import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { RecurringExpenseForm } from '../src/components/RecurringExpenseForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddRecurringExpenseScreen() {
    const router = useRouter();
    const addRecurringExpense = useBudgetStore(state => state.addRecurringExpense);
    const isLoading = useBudgetStore(state => state.recurringLoading);

    const handleSave = async (payload) => {
        await addRecurringExpense(payload);
        Alert.alert(
            'Recurring expense added!',
            '',
            [{ text: 'Done', onPress: () => router.back() }]
        );
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Add Recurring Expense', presentation: 'modal' }} />
            <RecurringExpenseForm
                onSave={handleSave}
                isLoading={isLoading}
                onCancel={() => router.back()}
            />
        </>
    );
}
