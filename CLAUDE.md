
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Context: BudgetPro (React Native)

### What This Is
A personal expense tracker mobile app built with Expo (React Native). It has a companion iOS native app (SwiftUI) in the sibling `BudgetPro/` directory. The RN app is the active development target.

### Tech Stack
- **Framework:** Expo ~54 with Expo Router (file-based routing)
- **Language:** JavaScript (JS in `app/` and `src/`), TypeScript in `components/` and `hooks/`
- **Backend:** Supabase (auth + database) — client at `src/services/supabase.js`
- **State:** Zustand store at `src/store/useBudgetStore.js` (single global store for all transactions, budgets, and totals)
- **Font:** Manrope (Light, Regular, Medium, SemiBold, Bold) loaded in `app/_layout.js`
- **Theme:** Light/dark color tokens in `src/constants/theme.js`; theme-aware styling is done by passing the active theme into components

### Directory Layout
```
app/               # Expo Router screens (file = route)
  (tabs)/          # Bottom tab navigator (index, profile)
  login.js, signup.js
  add-expense.js, edit-expense.js, expenses-detail.js
  add-income.js, edit-income.js, incomes-detail.js
  create-budget.js, edit-budget.js
  expense-category-detail.js, about.js
  savings-analysis.js
src/
  components/      # Reusable UI (TransactionRow, TransactionForm, etc.)
    common/        # AppButton, AppTextField, CardView, etc.
  constants/       # theme.js, categories.js
  services/        # supabase.js, transactionService.js
  store/           # useBudgetStore.js (Zustand)
components/        # Expo default components (mostly unused/legacy)
hooks/             # useColorScheme, useThemeColor
```

### Data Model (Supabase)
- **expenses** — amount, date, category (string key), note, user_id
- **incomes** — amount, date, category (string key), note, user_id
- **budgets** — amount, category, month, year, user_id

Transactions are fetched per `selectedMonth` / `selectedYear` from the store. State is updated optimistically on add; re-fetched on month/year change.

### Categories
Defined in `src/constants/categories.js` as arrays of `{ value, displayName, iconName, color }`. Icons are from `@expo/vector-icons` (Ionicons). Helper functions: `getExpenseCategory(value)`, `getIncomeCategory(value)`.

### Auth Flow
Supabase session is bootstrapped in `app/_layout.js`. Session state drives redirect: unauthenticated → `/login`; authenticated on public route → `/(tabs)`.

### Run the App
```
npm start          # Expo dev server (scan QR with Expo Go)
npm run ios        # iOS simulator
npm run android    # Android emulator
```
