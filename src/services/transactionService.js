import { supabase } from './supabase';

export const transactionService = {
    /**
     * Add a new expense
     * @param {Object} expense -> { userId, name, amount, category, date }
     */
    async addExpense({ userId, name, amount, category, date }) {
        if (!userId) throw new Error('User ID is required');

        try {
            const { data, error } = await supabase
                .from('expenses')
                .insert([
                    {
                        user_id: userId,
                        name: name,
                        amount: amount,
                        category: category,
                        date: date
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    },

    async updateExpense({ id, name, amount, category, date }) {
        if (!id) throw new Error('Expense ID is required');
        try {
            const { data, error } = await supabase
                .from('expenses')
                .update({ name, amount, category, date })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    },

    async deleteExpense(id) {
        if (!id) throw new Error('Expense ID is required');
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    },

    /**
     * Add a new income
     * @param {Object} income -> { userId, source, amount, category, date }
     */
    async addIncome({ userId, source, amount, category, date }) {
        if (!userId) throw new Error('User ID is required');

        try {
            const { data, error } = await supabase
                .from('incomes')
                .insert([
                    {
                        user_id: userId,
                        source: source,
                        amount: amount,
                        category: category,
                        date: date
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding income:', error);
            throw error;
        }
    },

    async updateIncome({ id, source, amount, category, date }) {
        if (!id) throw new Error('Income ID is required');
        try {
            const { data, error } = await supabase
                .from('incomes')
                .update({ source, amount, category, date })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating income:', error);
            throw error;
        }
    },

    async deleteIncome(id) {
        if (!id) throw new Error('Income ID is required');
        try {
            const { error } = await supabase.from('incomes').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting income:', error);
            throw error;
        }
    },

    /**
     * Fetch transactions for a specific month and year
     * @param {string} userId 
     * @param {number} month - 0-indexed month (0-11)
     * @param {number} year - 4 digit year
     */
    async fetchTransactions(userId, month, year) {
        if (!userId) throw new Error('User ID is required');

        // The Swift iOS app inserts dates as ISO8601 UTC strings.
        // JS Date(year, month, 1) matches Swift's getMonthStartDate(month, year) because both
        // respect the local timezone before serializing to UTC.
        // month in JS is 0-indexed (0-11).
        const startDate = new Date(Date.UTC(year, month, 1)).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        try {
            const [expensesResult, incomesResult, budgetResult] = await Promise.all([
                supabase
                    .from('expenses')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .order('date', { ascending: false })
                    .order('id', { ascending: false }),
                
                supabase
                    .from('incomes')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .order('date', { ascending: false })
                    .order('id', { ascending: false }),
                    
                supabase
                    .from('budget')
                    .select('*')
                    .eq('user_id', userId)
                    // The Swift code uses an exact match for the month start date: RepoQueryFilter(column: "date", op: .eq, value: targetDate)
                    .eq('date', startDate)
            ]);

            if (expensesResult.error) throw expensesResult.error;
            if (incomesResult.error) throw incomesResult.error;
            if (budgetResult.error && budgetResult.error.code !== '42P01') throw budgetResult.error; // Ignore if table missing temporarily

            return {
                expenses: expensesResult.data || [],
                incomes: incomesResult.data || [],
                budgets: budgetResult.data || []
            };
        } catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    },

    /**
     * Update existing budget rows by ID, inserting any that have no ID yet.
     * @param {string} userId
     * @param {number} month  0-indexed
     * @param {number} year
     * @param {{ id?: number, category: string, amount: number }[]} budgets
     */
    async updateBudgets(userId, month, year, budgets) {
        const startDate = new Date(Date.UTC(year, month, 1)).toISOString();

        const withId    = budgets.filter(b => b.id);
        const withoutId = budgets.filter(b => !b.id);

        const ops = [
            ...withId.map(b =>
                supabase.from('budget').update({ amount: b.amount }).eq('id', b.id)
            ),
            ...(withoutId.length > 0 ? [
                supabase.from('budget').insert(
                    withoutId.map(b => ({
                        user_id: userId,
                        date: startDate,
                        category: b.category,
                        amount: b.amount,
                    }))
                )
            ] : []),
        ];

        const results = await Promise.all(ops);
        for (const { error } of results) {
            if (error) throw error;
        }
    },

    /**
     * Save budgets for a month — replaces all existing entries for that month.
     * @param {string} userId
     * @param {number} month  0-indexed
     * @param {number} year
     * @param {{ category: string, amount: number }[]} budgets
     */
    async saveBudgets(userId, month, year, budgets) {
        const startDate = new Date(Date.UTC(year, month, 1)).toISOString();

        const { error: deleteError } = await supabase
            .from('budget')
            .delete()
            .eq('user_id', userId)
            .eq('date', startDate);

        if (deleteError) throw deleteError;

        if (budgets.length > 0) {
            const rows = budgets.map(b => ({
                user_id: userId,
                date: startDate,
                category: b.category,
                amount: b.amount,
            }));
            const { error: insertError } = await supabase.from('budget').insert(rows);
            if (insertError) throw insertError;
        }
    }
};
