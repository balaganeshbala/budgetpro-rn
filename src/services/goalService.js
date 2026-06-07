import { supabase } from './supabase';

export const goalService = {
    async fetchGoals(userId) {
        const { data, error } = await supabase
            .from('financial_goals')
            .select('*, goal_contributions(*)')
            .eq('user_id', userId)
            .order('target_date', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async fetchGoalById(goalId) {
        const { data, error } = await supabase
            .from('financial_goals')
            .select('*, goal_contributions(*)')
            .eq('goal_id', goalId)
            .single();
        if (error) throw error;
        return data;
    },

    async addGoal({ userId, title, icon, colorHex, targetAmount, targetDate, status }) {
        const { data, error } = await supabase
            .from('financial_goals')
            .insert([{ user_id: userId, title, icon, color_hex: colorHex, target_amount: targetAmount, target_date: targetDate, status }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateGoal({ goalId, title, icon, colorHex, targetAmount, targetDate, status }) {
        const { data, error } = await supabase
            .from('financial_goals')
            .update({ title, icon, color_hex: colorHex, target_amount: targetAmount, target_date: targetDate, status })
            .eq('goal_id', goalId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteGoal(goalId) {
        const { error } = await supabase.from('financial_goals').delete().eq('goal_id', goalId);
        if (error) throw error;
    },

    async addContribution({ goalId, name, amount, date }) {
        const { data, error } = await supabase
            .from('goal_contributions')
            .insert([{ goal_id: goalId, name, amount, date }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateContribution({ id, name, amount, date }) {
        const { data, error } = await supabase
            .from('goal_contributions')
            .update({ name, amount, date })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteContribution(id) {
        const { error } = await supabase.from('goal_contributions').delete().eq('id', id);
        if (error) throw error;
    },
};

export const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
