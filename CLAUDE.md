
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
  (tabs)/          # Bottom tab navigator (index, more, profile)
  login.js, signup.js
  add-expense.js, edit-expense.js, expenses-detail.js
  add-income.js, edit-income.js, incomes-detail.js
  create-budget.js, edit-budget.js
  expense-category-detail.js, about.js
  savings-analysis.js
  monthly-trends.js
  major-expenses.js, add-major-expense.js, edit-major-expense.js
  financial-goals.js                          # Goal list screen
  financial-goal-details.js                   # Goal detail (contributions grouped by month)
  add-financial-goal.js, edit-financial-goal.js
  add-contribution.js, edit-contribution.js
  goal-contributions.js                       # "View All" contributions screen
  recurring-expenses.js, year-comparison.js   # Coming Soon placeholders
  settings.js
src/
  components/      # Reusable UI (TransactionRow, TransactionForm, MajorExpenseForm, etc.)
    common/        # AppButton, AppTextField, CardView, SettingsRow, SectionHeader, AllTransactionsList, etc.
    EmptyDataIndicatorView.js  # Centered empty-state view (icon + title + bodyText props)
    GoalForm.js    # Add/edit goal form (emoji picker, color grid, date picker, status segmented control)
    ContributionForm.js  # Add/edit contribution form
  constants/       # theme.js, categories.js
  services/        # supabase.js, transactionService.js, goalService.js
  store/           # useBudgetStore.js (Zustand)
components/        # Expo default components (mostly unused/legacy)
hooks/             # useColorScheme, useThemeColor
```

### Data Model (Supabase)
- **expenses** — amount, date, category (string key), note, user_id
- **incomes** — amount, date, category (string key), note, user_id
- **budget** — amount, category, date (month start UTC ISO string), user_id
- **major_expenses** — id, name, amount, category (string key), date, notes, user_id; fetched per `selectedMajorYear` (calendar year, not month)
- **financial_goals** — goal_id, title, icon (emoji), color_hex, target_amount, target_date (YYYY-MM-DD), status (`active | paused | completed`), user_id
- **goal_contributions** — id, goal_id, name, amount, date (YYYY-MM-DD), user_id; nested-fetched with goals via `goal_contributions(*)`

Transactions are fetched per `selectedMonth` / `selectedYear` from the store. State is updated optimistically on add; re-fetched on month/year change.

#### Summary Tables (pre-aggregated, do not write to these from the app)
- **monthly_expense_summaries** — user_id, year, month (1-indexed), total_amount
- **monthly_income_summaries** — user_id, year, month (1-indexed), total_amount
- **monthly_budget_summaries** — user_id, year, month (1-indexed), total_amount
- **category_monthly_summaries** — user_id, year, month (1-indexed), category_name, category_type (`expense | income | budget`), total_amount

These mirror the Swift app's summary tables. `monthly-trends.js` reads from `monthly_expense_summaries` and `monthly_income_summaries` via `transactionService.fetchMonthlyTrends()`. Month values in these tables are **1-indexed** (1–12), unlike the JS `Date.getMonth()` which is 0-indexed.

### Categories
Defined in `src/constants/categories.js` as arrays of `{ value, displayName, iconName, color }`. Icons are from `@expo/vector-icons` (Ionicons). Helper functions: `getExpenseCategory(value)`, `getIncomeCategory(value)`, `getMajorExpenseCategory(value)`.

### Home Screen (`app/(tabs)/index.js`)

- **By Category section**: Uses an inline `CategoryGridItem` component (defined at module level above `HomeScreen`). Each row shows icon + name + remaining/overspent amount. Tapping navigates to `/expense-category-detail?cat=<value>`. Only rendered when `categoryBreakdown.length > 0`.
- **Savings Analysis row**: Only rendered when `expenses.length > 0`. Income Details row is always shown.
- **`AllTransactionsList`** (`src/components/common/AllTransactionsList.js`): Shared sortable transaction list used in `expenses-detail` and `incomes-detail`. Renders a sort header + `CardView` of `TransactionRow` items. Shows `EmptyDataIndicatorView` inside the card when empty.

### TransactionForm (`src/components/TransactionForm.js`)

- **`initialCategory` prop**: Pre-selects a category without triggering edit mode. Use this when navigating from a category detail screen to add a new expense (e.g., `add-expense.js` reads `cat` from `useLocalSearchParams` and passes it as `initialCategory`). Do NOT use `initialData={{ category }}` — that triggers "Update" button mode and crashes on missing `initialData.date`.

### Detail Screen Patterns

- **Header `+` button**: Both `expense-category-detail.js` and `incomes-detail.js` have a `+` icon in `Stack.Screen headerRight` that navigates to the add screen. `expense-category-detail` passes `cat` as a param so the form pre-selects the category.
- **Full-screen empty state**: `incomes-detail.js` shows `EmptyDataIndicatorView` (full-screen, `flex:1 justifyContent:center`) when `incomes.length === 0`, replacing the entire ScrollView content including summary cards.

### More Tab (hub screen)
`app/(tabs)/more.js` is a hub/menu screen using `SettingsRow` items grouped into `SectionHeader` sections:
- **Analysis** — Monthly Trends (`/monthly-trends`), Year-over-Year (`/year-comparison`)
- **Tracking** — Major Expenses (`/major-expenses`), Recurring Expenses (`/recurring-expenses`)
- **Planning** — Financial Goals (`/financial-goals`)

`recurring-expenses.js` and `year-comparison.js` are still placeholder "Coming Soon" screens. Financial Goals is fully implemented.

### Settings Screen
`app/settings.js` — accessible from Profile → Settings row. Currently has one section:
- **Appearance** — Theme row; tapping opens a centered modal (same pattern as category selector) with System Default / Light / Dark options.

Theme preference is persisted to AsyncStorage under key `@theme_preference`. On selection, `Appearance.setColorScheme()` is called immediately so all screens update without any code changes to them. On app startup, `app/_layout.js` restores the saved preference by calling `Appearance.setColorScheme()` before render.

### Financial Goals Feature

#### Store state (in `useBudgetStore.js`)
- `goals[]` — full list with nested `goal_contributions`
- `goalsLoading` — true only during initial fetch
- `activeGoal` — the currently viewed goal (set via `setActiveGoal`)
- `goalActionLoading` — true during add/edit/delete operations

#### Key patterns
- **No re-fetch on return from sub-screens**: screens use `useEffect([userId/goalId])` (not `useFocusEffect`). All mutations go through store actions that patch both `activeGoal` and the matching entry in `goals[]` simultaneously.
- **goal-contributions screen** reads `activeGoal` from the store — no API call, always in sync.
- **Contributions grouped by month**: `date.slice(0, 7)` as key ("YYYY-MM"). Use `new Date(key + '-02')` for the display label to avoid timezone off-by-one with day 1.
- **`toYMD(date)`** helper in `goalService.js` formats a JS Date → `"yyyy-MM-dd"` string.

#### Edit screen conventions
- Delete button is in `headerRight` as a trash icon (same as `edit-expense.js`), NOT inside the form.
- Update button is disabled until `isDirty` (any field differs from `initialData`).
- `GoalForm` and `ContributionForm` compute `isDirty` internally; no `onDelete` prop — delete is handled by the parent screen.

#### Date picker (cross-platform)
- iOS: `DateTimePicker` wrapped in a custom `Modal` with `display="spinner"` + Done button.
- Android: `DateTimePicker` rendered directly (no Modal); `display="default"` shows the native dialog. On change: `(event, d) => { setShowDatePicker(false); if (event.type === 'set' && d) setDate(d); }`.
- Do NOT wrap in a Modal on Android — the native dialog and the Modal both show, causing a double popup.

### React Navigation / Expo Router Notes

This app uses `@react-navigation/native-stack` (not the JS stack). Key differences:

- **Hiding back button title**: Use `headerBackButtonDisplayMode: 'minimal'` on the current screen. This is the native-stack v7 API — `headerBackTitleVisible` is JS-stack only and has no effect here. `headerBackTitle: ''` (empty string) is unreliable (treated as falsy in some versions).
- **Where to set it**: Set on the screen that *shows* the back button (the current screen), NOT on the previous screen. Also set it statically in `_layout.js` to avoid a race before component mount — dynamic `Stack.Screen` options in the component only apply after first render.
- **`headerBackTitle`** on the previous screen controls what text appears as the back label on the NEXT screen — but this is unreliable with empty strings; prefer `headerBackButtonDisplayMode`.

### Auth Flow
Supabase session is bootstrapped in `app/_layout.js`. Session state drives redirect: unauthenticated → `/login`; authenticated on public route → `/(tabs)`. The splash screen is held until **both** fonts and the Supabase session are resolved to avoid a blank white flash on startup.

### Run the App
```
npm start          # Expo dev server (scan QR with Expo Go)
npm run ios        # iOS simulator
npm run android    # Android emulator
```
