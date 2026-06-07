import { Stack, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { GoalForm } from '../src/components/GoalForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddFinancialGoalRoute() {
    const router = useRouter();
    const addGoal = useBudgetStore(state => state.addGoal);
    const isLoading = useBudgetStore(state => state.goalsLoading);

    const handleSave = async (payload) => {
        try {
            await addGoal(payload);
            router.back();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'New Goal', presentation: 'modal', headerBackTitle: '' }} />
            <GoalForm onSave={handleSave} isLoading={isLoading} />
        </>
    );
}
