import { create } from 'zustand';
import { supabase } from '../services/supabase';
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
}));

// Keep userId in sync with the Supabase session.
// onAuthStateChange fires synchronously before navigation, so userId is always
// set by the time any screen calls fetchTransactions.
supabase.auth.onAuthStateChange((_event, session) => {
  useBudgetStore.setState({ userId: session?.user?.id ?? null });
});
