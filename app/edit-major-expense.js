import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { MajorExpenseForm } from '../src/components/MajorExpenseForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditMajorExpenseRoute() {
    const router = useRouter();
    const { transaction } = useLocalSearchParams();
    const expense = JSON.parse(transaction);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const updateMajorExpense = useBudgetStore(state => state.updateMajorExpense);
    const deleteMajorExpense = useBudgetStore(state => state.deleteMajorExpense);
    const isLoading = useBudgetStore(state => state.majorExpensesLoading);

    const handleSave = (payload) => {
        Alert.alert(
            'Update Major Expense',
            'Are you sure you want to update this expense?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    style: 'default',
                    onPress: async () => {
                        await updateMajorExpense({ id: expense.id, ...payload });
                        router.back();
                    },
                },
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Major Expense',
            'Are you sure you want to delete this expense? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteMajorExpense(expense.id);
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
                    title: 'Edit Major Expense',
                    presentation: 'modal',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
                            <Ionicons name="trash-outline" size={22} color={themeColors.adaptiveRed} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <MajorExpenseForm
                initialData={expense}
                onSave={handleSave}
                isLoading={isLoading}
                onCancel={() => router.back()}
            />
        </>
    );
}
