import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { goalService } from '../services/goalService';
import { transactionService } from '../services/transactionService';

export const useBudgetStore = create((set, get) => ({
  userId: null,
  expenses: [],
  incomes: [],
  budgets: [],
  totalExpenses: 0,
  totalIncome: 0,
  totalBudget: 0,
  isLoading: true,
  error: null,
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
  majorExpenses: [],
  totalMajorExpenses: 0,
  selectedMajorYear: new Date().getFullYear(),
  majorExpensesLoading: false,

  setSelectedMonth: (month) => {
    set({ selectedMonth: month });
    get().fetchTransactions();
  },
  
  setSelectedYear: (year) => {
    set({ selectedYear: year });
    get().fetchTransactions();
  },
  // Computed properties (Selectors) - Keep for backward compatibility if needed elsewhere
  getTotalExpenses: () => get().totalExpenses,
  getTotalIncome: () => get().totalIncome,
  getTotalBudget: () => get().totalBudget,

  getBalance: () => {
    return get().getTotalIncome() - get().getTotalExpenses();
  },

  // Actions
  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');

      const newExpense = await transactionService.addExpense({
        ...expenseData,
        userId
      });
      
      // Update local state instantly without another network fetch
      const currentMonth = get().selectedMonth;
      const currentYear = get().selectedYear;
      const expenseDate = new Date(newExpense.date);

      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        const updatedExpenses = [newExpense, ...get().expenses].sort((a, b) => {
          const dateDiff = new Date(b.date) - new Date(a.date);
          if (dateDiff !== 0) return dateDiff;
          return b.id - a.id; // Higher id first within same day
        });
        set(state => ({
          expenses: updatedExpenses,
          totalExpenses: state.totalExpenses + (newExpense.amount || 0),
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  addIncome: async (incomeData) => {
    set({ isLoading: true, error: null });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');

      const newIncome = await transactionService.addIncome({
        ...incomeData,
        userId
      });
      
      // Update local state instantly without another network fetch
      const currentMonth = get().selectedMonth;
      const currentYear = get().selectedYear;
      const incomeDate = new Date(newIncome.date);

      if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
        const updatedIncomes = [newIncome, ...get().incomes].sort((a, b) => {
          const dateDiff = new Date(b.date) - new Date(a.date);
          if (dateDiff !== 0) return dateDiff;
          return b.id - a.id; // Higher id first within same day
        });
        set(state => ({
          incomes: updatedIncomes,
          totalIncome: state.totalIncome + (newIncome.amount || 0),
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  updateExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await transactionService.updateExpense(expenseData);
      const updatedList = get().expenses.map(e => e.id === updated.id ? updated : e);
      set({
        expenses: updatedList,
        totalExpenses: updatedList.reduce((acc, e) => acc + (e.amount || 0), 0),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.deleteExpense(id);
      const updatedList = get().expenses.filter(e => e.id !== id);
      set({
        expenses: updatedList,
        totalExpenses: updatedList.reduce((acc, e) => acc + (e.amount || 0), 0),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  updateIncome: async (incomeData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await transactionService.updateIncome(incomeData);
      const updatedList = get().incomes.map(i => i.id === updated.id ? updated : i);
      set({
        incomes: updatedList,
        totalIncome: updatedList.reduce((acc, i) => acc + (i.amount || 0), 0),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  deleteIncome: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.deleteIncome(id);
      const updatedList = get().incomes.filter(i => i.id !== id);
      set({
        incomes: updatedList,
        totalIncome: updatedList.reduce((acc, i) => acc + (i.amount || 0), 0),
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');

      const { selectedMonth, selectedYear } = get();
      const data = await transactionService.fetchTransactions(userId, selectedMonth, selectedYear);
      const expensesList = data.expenses || [];
      const incomesList = data.incomes || [];
      const budgetsList = data.budgets || [];
      
      const totalExpenses = expensesList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalIncome = incomesList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalBudget = budgetsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      set({
        expenses: expensesList,
        incomes: incomesList,
        budgets: budgetsList,
        totalExpenses,
        totalIncome,
        totalBudget,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      console.error(error);
    }
  },

  updateBudgets: async (budgetData) => {
    set({ isLoading: true, error: null });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');
      const { selectedMonth, selectedYear } = get();
      await transactionService.updateBudgets(userId, selectedMonth, selectedYear, budgetData);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  saveBudgets: async (budgetData) => {
    set({ isLoading: true, error: null });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');
      const { selectedMonth, selectedYear } = get();
      await transactionService.saveBudgets(userId, selectedMonth, selectedYear, budgetData);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setSelectedMajorYear: (year) => {
    set({ selectedMajorYear: year });
    get().fetchMajorExpenses();
  },

  fetchMajorExpenses: async () => {
    set({ majorExpensesLoading: true });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');
      const data = await transactionService.fetchMajorExpenses(userId, get().selectedMajorYear);
      set({
        majorExpenses: data,
        totalMajorExpenses: data.reduce((acc, e) => acc + (e.amount || 0), 0),
        majorExpensesLoading: false,
      });
    } catch (error) {
      set({ majorExpensesLoading: false });
      console.error(error);
    }
  },

  addMajorExpense: async (data) => {
    set({ majorExpensesLoading: true });
    try {
      const userId = get().userId;
      if (!userId) throw new Error('User not authenticated');
      const newItem = await transactionService.addMajorExpense({ ...data, userId });
      const year = get().selectedMajorYear;
      if (new Date(newItem.date).getFullYear() === year) {
        const updated = [newItem, ...get().majorExpenses].sort((a, b) => {
          const diff = new Date(b.date) - new Date(a.date);
          return diff !== 0 ? diff : b.id - a.id;
        });
        set(state => ({
          majorExpenses: updated,
          totalMajorExpenses: state.totalMajorExpenses + (newItem.amount || 0),
          majorExpensesLoading: false,
        }));
      } else {
        set({ majorExpensesLoading: false });
      }
    } catch (error) {
      set({ majorExpensesLoading: false });
      console.error(error);
      throw error;
    }
  },

  updateMajorExpense: async (data) => {
    set({ majorExpensesLoading: true });
    try {
      const updated = await transactionService.updateMajorExpense(data);
      const updatedList = get().majorExpenses.map(e => e.id === updated.id ? updated : e);
      set({
        majorExpenses: updatedList,
        totalMajorExpenses: updatedList.reduce((acc, e) => acc + (e.amount || 0), 0),
        majorExpensesLoading: false,
      });
    } catch (error) {
      set({ majorExpensesLoading: false });
      console.error(error);
      throw error;
    }
  },

  deleteMajorExpense: async (id) => {
    set({ majorExpensesLoading: true });
    try {
      await transactionService.deleteMajorExpense(id);
      const updatedList = get().majorExpenses.filter(e => e.id !== id);
      set({
        majorExpenses: updatedList,
        totalMajorExpenses: updatedList.reduce((acc, e) => acc + (e.amount || 0), 0),
        majorExpensesLoading: false,
      });
    } catch (error) {
      set({ majorExpensesLoading: false });
      console.error(error);
      throw error;
    }
  },

  // Financial Goals — list + active goal state
  goals: [],
  goalsLoading: false,
  activeGoal: null,
  goalActionLoading: false,

  fetchGoals: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ goalsLoading: true });
    try {
      const data = await goalService.fetchGoals(userId);
      set({ goals: data });
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      set({ goalsLoading: false });
    }
  },

  addGoal: async (payload) => {
    set({ goalsLoading: true });
    try {
      const { userId } = get();
      const newGoal = await goalService.addGoal({ ...payload, userId });
      const newList = [...get().goals, { ...newGoal, goal_contributions: [] }];
      newList.sort((a, b) => a.target_date.localeCompare(b.target_date));
      set({ goals: newList });
    } catch (error) {
      throw error;
    } finally {
      set({ goalsLoading: false });
    }
  },

  deleteGoal: async (goalId) => {
    set({ goalActionLoading: true });
    try {
      await goalService.deleteGoal(goalId);
      set({
        goals: get().goals.filter(g => g.goal_id !== goalId),
        activeGoal: null,
      });
    } catch (error) {
      throw error;
    } finally {
      set({ goalActionLoading: false });
    }
  },

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  addContribution: async ({ goalId, name, amount, date }) => {
    set({ goalActionLoading: true });
    try {
      const newContrib = await goalService.addContribution({ goalId, name, amount, date });
      const { activeGoal, goals } = get();
      const patchContribs = (contribs) => [newContrib, ...(contribs || [])];
      const updatedGoal = activeGoal?.goal_id === goalId
        ? { ...activeGoal, goal_contributions: patchContribs(activeGoal.goal_contributions) }
        : activeGoal;
      set({
        activeGoal: updatedGoal,
        goals: goals.map(g => g.goal_id === goalId
          ? { ...g, goal_contributions: patchContribs(g.goal_contributions) }
          : g
        ),
      });
    } catch (error) {
      throw error;
    } finally {
      set({ goalActionLoading: false });
    }
  },

  updateContribution: async ({ id, name, amount, date }) => {
    set({ goalActionLoading: true });
    try {
      const updated = await goalService.updateContribution({ id, name, amount, date });
      const { activeGoal, goals } = get();
      const patchContribs = (contribs) => (contribs || []).map(c => c.id === id ? updated : c);
      const goalId = activeGoal?.goal_id;
      set({
        activeGoal: activeGoal ? { ...activeGoal, goal_contributions: patchContribs(activeGoal.goal_contributions) } : activeGoal,
        goals: goals.map(g => g.goal_id === goalId
          ? { ...g, goal_contributions: patchContribs(g.goal_contributions) }
          : g
        ),
      });
    } catch (error) {
      throw error;
    } finally {
      set({ goalActionLoading: false });
    }
  },

  deleteContribution: async (id) => {
    set({ goalActionLoading: true });
    try {
      await goalService.deleteContribution(id);
      const { activeGoal, goals } = get();
      const patchContribs = (contribs) => (contribs || []).filter(c => c.id !== id);
      const goalId = activeGoal?.goal_id;
      set({
        activeGoal: activeGoal ? { ...activeGoal, goal_contributions: patchContribs(activeGoal.goal_contributions) } : activeGoal,
        goals: goals.map(g => g.goal_id === goalId
          ? { ...g, goal_contributions: patchContribs(g.goal_contributions) }
          : g
        ),
      });
    } catch (error) {
      throw error;
    } finally {
      set({ goalActionLoading: false });
    }
  },

  updateCurrentGoal: async ({ goalId, title, icon, colorHex, targetAmount, targetDate, status }) => {
    set({ goalActionLoading: true });
    try {
      await goalService.updateGoal({ goalId, title, icon, colorHex, targetAmount, targetDate, status });
      const { activeGoal, goals } = get();
      const patch = (g) => ({ ...g, title, icon, color_hex: colorHex, target_amount: targetAmount, target_date: targetDate, status });
      const updatedGoal = activeGoal?.goal_id === goalId ? patch(activeGoal) : activeGoal;
      const updatedList = goals.map(g => g.goal_id === goalId ? patch(g) : g);
      updatedList.sort((a, b) => a.target_date.localeCompare(b.target_date));
      set({ activeGoal: updatedGoal, goals: updatedList });
    } catch (error) {
      throw error;
    } finally {
      set({ goalActionLoading: false });
    }
  },
}));

// Keep userId in sync with the Supabase session.
// onAuthStateChange fires synchronously before navigation, so userId is always
// set by the time any screen calls fetchTransactions.
supabase.auth.onAuthStateChange((_event, session) => {
  useBudgetStore.setState({ userId: session?.user?.id ?? null });
});
