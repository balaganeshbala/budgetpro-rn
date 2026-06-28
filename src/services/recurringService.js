import { supabase } from './supabase';

export const recurringService = {
  async fetchRecurring(userId) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('billing_month', { ascending: true, nullsFirst: true })
      .order('billing_day', { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data || [];
  },

  async addRecurring({ userId, name, amount, category, frequency, billingDay, billingMonth, notes }) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        user_id: userId,
        name,
        amount,
        category,
        frequency,
        billing_day: billingDay ?? null,
        billing_month: billingMonth ?? null,
        notes: notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRecurring({ id, name, amount, category, frequency, billingDay, billingMonth, notes }) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .update({
        name,
        amount,
        category,
        frequency,
        billing_day: billingDay ?? null,
        billing_month: billingMonth ?? null,
        notes: notes || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteRecurring(id) {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
