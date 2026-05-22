import { supabase } from './supabase';

/**
 * Gets the start and end dates for a given month and year in YYYY-MM-DD format
 */
const getMonthDateRange = (month, year) => {
    // month is 0-indexed here (0 = Jan, 11 = Dec)
    const startDate = new Date(year, month, 1);

    // Get the first day of next month to serve as an exclusive upper bound
    const endDate = new Date(year, month + 1, 1);

    const pad = (num) => num.toString().padStart(2, '0');

    return {
        start: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-01`,
        end: `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-01`
    };
};

export const budgetService = {
    /**
     * Fetch budget aggregate data for a specific user and month
     * @param {string} userId - Auth user ID
     * @param {number} month - 0-indexed month (0 = Jan)
     * @param {number} year - Full year (e.g., 2024)
     * @returns {Promise<{totalBudget: number, totalSpent: number, incomes: any[], expenses: any[]}>}
     */
    async getMonthOverview(userId, month, year) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const { start, end } = getMonthDateRange(month, year);

        try {
            // 1. Fetch Budget Target
            // The iOS app stored individual budget entries per category for a month, so we sum them
            const { data: budgetData, error: budgetError } = await supabase
                .from('budget')
                .select('amount')
                .eq('user_id', userId)
                .eq('date', start); // iOS stored budget date as the start of the month

            if (budgetError) throw budgetError;

            const totalBudget = budgetData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

            // 2. Fetch Expenses within the month
            const { data: expensesData, error: expensesError } = await supabase
                .from('expenses')
                .select('amount, name, category, date, id')
                .eq('user_id', userId)
                .gte('date', start)
                .lt('date', end);

            if (expensesError) throw expensesError;

            const totalSpent = expensesData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

            // 3. Fetch Incomes within the month (for future use/transactions section)
            const { data: incomesData, error: incomesError } = await supabase
                .from('incomes')
                .select('*')
                .eq('user_id', userId)
                .gte('date', start)
                .lt('date', end);

            if (incomesError) throw incomesError;

            return {
                totalBudget,
                totalSpent,
                expenses: expensesData || [],
                incomes: incomesData || []
            };

        } catch (error) {
            console.error('Error fetching budget overview:', error);
            throw error;
        }
    }
};
