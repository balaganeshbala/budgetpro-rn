import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, TouchableOpacity, useColorScheme } from 'react-native';
import { ContributionForm } from '../src/components/ContributionForm';
import { colors } from '../src/constants/theme';
import { useBudgetStore } from '../src/store/useBudgetStore';

export default function EditContributionRoute() {
    const router = useRouter();
    const { contribution: contribJson } = useLocalSearchParams();
    const contribution = JSON.parse(contribJson);

    const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const themeColors = colors[scheme];

    const updateContribution = useBudgetStore(state => state.updateContribution);
    const deleteContribution = useBudgetStore(state => state.deleteContribution);
    const isLoading = useBudgetStore(state => state.goalActionLoading);

    const handleSave = async (payload) => {
        try {
            await updateContribution({ id: contribution.id, ...payload });
            router.back();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Contribution',
            'Remove this contribution from the goal?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteContribution(contribution.id);
                            router.back();
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
                    title: 'Edit Contribution',
                    presentation: 'modal',
                    headerBackTitle: '',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleDelete} style={{ padding: 8 }}>
                            <Ionicons name="trash-outline" size={22} color={themeColors.adaptiveRed} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ContributionForm initialData={contribution} onSave={handleSave} isLoading={isLoading} />
        </>
    );
}
