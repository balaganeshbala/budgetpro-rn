import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { RecurringExpenseForm } from '../src/components/RecurringExpenseForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditRecurringExpenseScreen() {
    const router = useRouter();
    const { item } = useLocalSearchParams();
    const expense = JSON.parse(item);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const updateRecurringExpense = useBudgetStore(state => state.updateRecurringExpense);
    const deleteRecurringExpense = useBudgetStore(state => state.deleteRecurringExpense);
    const isLoading = useBudgetStore(state => state.recurringLoading);

    const handleSave = (payload) => {
        Alert.alert(
            'Update Recurring Expense',
            'Are you sure you want to update this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async () => {
                        await updateRecurringExpense({ id: expense.id, ...payload });
                        router.back();
                    },
                },
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Recurring Expense',
            'Are you sure you want to delete this item? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteRecurringExpense(expense.id);
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Edit Recurring Expense',
                    presentation: 'modal',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
                            <Ionicons name="trash-outline" size={22} color={themeColors.adaptiveRed} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <RecurringExpenseForm
                initialData={expense}
                onSave={handleSave}
                isLoading={isLoading}
                onCancel={() => router.back()}
            />
        </>
    );
}
