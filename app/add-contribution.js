import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { ContributionForm } from '../src/components/ContributionForm';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function AddContributionRoute() {
    const router = useRouter();
    const { goalId, goalTitle } = useLocalSearchParams();

    const addContribution = useBudgetStore(state => state.addContribution);
    const isLoading = useBudgetStore(state => state.goalActionLoading);

    const handleSave = async (payload) => {
        try {
            await addContribution({ ...payload, goalId });
            router.back();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Add Contribution', presentation: 'modal', headerBackTitle: '' }} />
            <ContributionForm goalTitle={goalTitle} onSave={handleSave} isLoading={isLoading} />
        </>
    );
}
