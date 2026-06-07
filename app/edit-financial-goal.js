import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { GoalForm } from '../src/components/GoalForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditFinancialGoalRoute() {
    const router = useRouter();
    const { goal: goalJson } = useLocalSearchParams();
    const goal = JSON.parse(goalJson);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const updateCurrentGoal = useBudgetStore(state => state.updateCurrentGoal);
    const deleteGoal = useBudgetStore(state => state.deleteGoal);
    const isLoading = useBudgetStore(state => state.goalActionLoading);

    const handleSave = async (payload) => {
        try {
            await updateCurrentGoal({ goalId: goal.goal_id, ...payload });
            router.back();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Goal',
            'This will permanently delete the goal and all its contributions.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGoal(goal.goal_id);
                            router.navigate('/financial-goals');
                        } catch (e) {
                            Alert.alert('Error', e.message);
                        }
                    },
                },
            ],
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Edit Goal',
                    presentation: 'modal',
                    headerBackTitle: '',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
                            <Ionicons name="trash-outline" size={22} color={themeColors.adaptiveRed} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <GoalForm initialData={goal} onSave={handleSave} isLoading={isLoading} />
        </>
    );
}
