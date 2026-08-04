
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
  (tabs)/          # Bottom tab navigator — index, transactions, more ONLY (3 tabs)
  profile.js       # Stack screen (NOT a tab); opened via router.push('/profile') from home header
  onboarding.js                                # First-launch carousel (3 slides); shown once then skipped
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
  recurring-expenses.js                        # Recurring expense list + summary
  add-recurring-expense.js, edit-recurring-expense.js
  year-comparison.js                           # Year-over-Year comparison (grouped bar chart, any two years)
  settings.js
src/
  components/      # Reusable UI (TransactionRow, TransactionForm, MajorExpenseForm, etc.)
    common/        # AppButton, AppTextField, CardView, SettingsRow, SectionHeader, AllTransactionsList, etc.
    EmptyDataIndicatorView.js  # Centered empty-state view (icon + title + bodyText props)
    GoalForm.js    # Add/edit goal form (emoji picker, color grid, date picker, status segmented control)
    ContributionForm.js  # Add/edit contribution form
    RecurringExpenseForm.js  # Add/edit recurring expense form (category picker, frequency toggle, billing month/day)
  constants/       # theme.js, categories.js, months.js
  services/        # supabase.js, transactionService.js, goalService.js, recurringService.js
                   # offlineCache.js (AsyncStorage snapshots), writeQueue.js (offline write queue)
  store/           # useBudgetStore.js (Zustand)
components/        # Expo default components (mostly unused/legacy)
hooks/             # useColorScheme, useThemeColor
```

### Data Model (Supabase)
- **expenses** — amount, date, category (string key), note, user_id
- **incomes** — amount, date, category (string key), note, user_id
- **budget** — amount, category, date (month start UTC ISO string), user_id
- **major_expenses** — id, name, amount, category (string key), date, notes, user_id; fetched per `selectedMajorYear` (calendar year, not month)
- **recurring_expenses** — id, user_id, name, amount, category (string key), frequency (`monthly | yearly`), billing_day (int 1–31, nullable), billing_month (int 1–12, nullable, yearly only), notes; no date column — these are standing items, not dated transactions
- **financial_goals** — goal_id, title, icon (emoji), color_hex, target_amount, target_date (YYYY-MM-DD), status (`active | paused | completed`), user_id
- **goal_contributions** — id, goal_id, name, amount, date (YYYY-MM-DD), user_id; nested-fetched with goals via `goal_contributions(*)`

Transactions are fetched per `selectedMonth` / `selectedYear` from the store. State is updated optimistically on add; re-fetched on month/year change.

#### Summary Tables (pre-aggregated, do not write to these from the app)
- **monthly_expense_summaries** — user_id, year, month (1-indexed), total_amount
- **monthly_income_summaries** — user_id, year, month (1-indexed), total_amount
- **monthly_budget_summaries** — user_id, year, month (1-indexed), total_amount
- **category_monthly_summaries** — user_id, year, month (1-indexed), category_name, category_type (`expense | income | budget`), total_amount

These mirror the Swift app's summary tables. Month values are **1-indexed** (1–12), unlike JS `Date.getMonth()` which is 0-indexed.

- **`fetchMonthlyTrends(userId)`** — returns the last 24 months excluding the current month (oldest → newest). Used by `monthly-trends.js`. Current month excluded as it's incomplete.
- **`fetchAllMonthlySummaries(userId)`** — returns every available year-month row with no time cap (oldest → newest). Used by `year-comparison.js`. Row count is tiny (12 rows/year) so fetching all years is always fast.

### Categories
Defined in `src/constants/categories.js` as arrays of `{ value, displayName, iconName, color }`. Icons are from `@expo/vector-icons` (Ionicons). Helper functions: `getExpenseCategory(value)`, `getIncomeCategory(value)`, `getMajorExpenseCategory(value)`.

### Home Screen (`app/(tabs)/index.js`)

- **Header**: App icon (`src/assets/images/icon.png`) on the left, month nav centered, profile icon button (`person-circle-outline`) on the right. Profile button navigates to `/profile`.
- **Offline banner**: Amber strip rendered between the header row and the ScrollView when `isOffline` is true (read from store). Styled inline — no separate component.
- **"Insights" section header** above the Income Details and Savings Analysis cards.
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

Recurring Expenses, Financial Goals, and Year-over-Year Comparison are all fully implemented.

### Profile Screen (`app/profile.js`)
Moved from `app/(tabs)/profile.js` to a root stack screen. Opened via the profile icon in the home screen header (`router.push('/profile')`). Has a native back button. Tab bar only has `index`, `transactions`, and `more`.

### Month Name Constants (`src/constants/months.js`)
Single source of truth — `shortMonthNames` and `fullMonthNames`. Do not declare local month arrays in screens; import from here.

### BudgetOverviewCard (`src/components/BudgetOverviewCard.js`)
Uses `react-native-svg` for the donut arc. Shows used percentage (`{Math.round(percentage)}%` + "used") in the center hole. Two exports: `DonutArc` (default) and `BudgetOverviewCard` (named).

### Settings Screen
`app/settings.js` — accessible from Profile → Settings row. Currently has one section:
- **Appearance** — Theme row; tapping opens a centered modal (same pattern as category selector) with System Default / Light / Dark options.

Theme preference is persisted to AsyncStorage under key `@theme_preference`. On selection, `Appearance.setColorScheme()` is called immediately so all screens update without any code changes to them. On app startup, `app/_layout.js` restores the saved preference by calling `Appearance.setColorScheme()` before render.

### Recurring Expenses Feature

Tracks standing subscriptions, EMIs, and regular bills. Items have no transaction date — they represent recurring commitments, not individual payments.

#### Store state (in `useBudgetStore.js`)
- `recurringExpenses[]` — full list, fetched once on mount
- `recurringLoading` — true during any fetch/add/update/delete

#### Key patterns
- Fetched once on mount via `useEffect([userId])` — no re-fetch on return from add/edit screens; mutations patch the array in-place via store actions.
- **No "active/paused" state** — delete to remove an item.
- **`billing_month` is only set for yearly items** — monthly items always have `billing_month: null`.
- **Monthly cost summary** normalizes yearly items to per-month equivalent (`amount / 12`) for the aggregate total.
- List is sorted: monthly items by `billing_day`, yearly items by `billing_month` then `billing_day` (nulls last).
- `ordinal(n)` helper (defined locally in both `recurring-expenses.js` and `RecurringExpenseForm.js`) formats day numbers → "1st", "2nd", "3rd", etc.
- The `dueDateLabel(item)` helper in `recurring-expenses.js` returns `"due on the 5th"` (monthly) or `"due Jan 5th"` (yearly), or `null` if `billing_day` is not set.

#### Form (`RecurringExpenseForm.js`)
- Uses `EXPENSE_CATEGORIES` (not a separate category list).
- Frequency toggle is a segmented control (Monthly / Yearly) — switching to Monthly clears `billingMonth` from the saved payload.
- Billing month picker (modal, month names) only appears when frequency is `yearly`.
- Billing day is a free-form numeric text input (max 2 digits); validated to 1–31 on save, stored as `null` if blank or out of range.
- `isDirty` check guards the Update button on the edit screen.

#### Edit screen conventions
- Delete button is in `headerRight` as a trash icon (same pattern as `edit-major-expense.js`).
- Item is passed as `JSON.stringify(item)` in route params under the key `item` (not `transaction`).

### Financial Goals Feature

#### Store state (in `useBudgetStore.js`)
- `goals[]` — full list with nested `goal_contributions`
- `goalsLoading` — true only during initial fetch
- `activeGoal` — the currently viewed goal (set via `setActiveGoal`)
- `goalActionLoading` — true during add/edit/delete operations

#### Key patterns
- **No re-fetch on return from sub-screens**: screens use `useEffect([userId/goalId])` (not `useFocusEffect`). All mutations go through store actions that patch both `activeGoal` and the matching entry in `goals[]` simultaneously.
- **goal-contributions screen** reads `activeGoal` from the store — no API call, always in sync. Accepts optional `filterName` route param to show contributions for a single name only (title updates to that name).
- **Contributions grouped by month**: `date.slice(0, 7)` as key ("YYYY-MM"). Use `new Date(key + '-02')` for the display label to avoid timezone off-by-one with day 1.
- **`toYMD(date)`** helper in `goalService.js` formats a JS Date → `"yyyy-MM-dd"` string.

#### Goal detail screen (`financial-goal-details.js`) contribution layout
- **Contributions card**: shows the 5 most recent individual contributions (name + date / amount). Each row is tappable → `/edit-contribution`. "View All" navigates to `/goal-contributions` (all contributions, grouped by month).
- **By Name card**: name-grouped summary rows (name + count / total). Each row is tappable → `/goal-contributions?filterName=<name>` (filtered to that name only).

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

#### Navigation lag fix (deferred rendering)
Screens that do heavy synchronous work on mount (sorting, grouping, `toLocaleDateString` calls) block the JS thread and cause the navigation slide animation to stutter. Fix: defer content rendering until after the animation completes using `InteractionManager`, and memoize expensive computations with `useMemo`:
```js
const [ready, setReady] = useState(false);
useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => task.cancel();
}, []);
if (!ready) return <LoadingView />;
```
Applied in `goal-contributions.js`.

#### Centering a loader in a stack screen
`flex: 1` + `justifyContent: 'center'` centers within the **content area** (below the header), not the full screen — the spinner appears visually below center. To land it at the true screen center, add `paddingBottom: insets.top + 44` (header height) to the loading container. `insets` comes from `useSafeAreaInsets()`.
```js
<View style={[styles.container, styles.center, { paddingBottom: insets.top + 44 }]}>
    <ActivityIndicator />
</View>
```

### Offline Support

Lightweight offline support via two services and store-level logic. No external library.

#### Services
- **`src/services/offlineCache.js`** — saves/loads AsyncStorage snapshots. Keys: `@cache_tx_{year}_{month}` (transactions), `@cache_goals`, `@cache_recurring`, `@cache_major_{year}`, `@cache_summaries` (all-years monthly summaries for year-comparison).
- **`src/services/writeQueue.js`** — persists pending write operations to `@write_queue`. API: `enqueue(item)`, `dequeue(id)`, `getQueue()`.

#### Store additions (`useBudgetStore.js`)
- `isOffline: false` — set by NetInfo listener in `_layout.js`.
- `onboardingDone: false` — set at startup from AsyncStorage; also set to `true` immediately by `onboarding.js` on finish/skip so the routing guard reacts without waiting for a re-mount.
- `flushWriteQueue()` — called on reconnect and app startup (if online). Drains the queue by calling the real Supabase service for each item, replaces temp items in the store with real ones, then re-fetches to sync.

#### Fetch pattern (stale-while-revalidate)
All data fetches follow this pattern:
1. Load cache from AsyncStorage → apply immediately (no spinner if cache exists)
2. Fetch from Supabase in the background → update state and save new cache on success
3. On network failure: silently swallow if cache was shown; surface error only if no cache

Store-managed fetches: `fetchTransactions`, `fetchGoals`, `fetchRecurringExpenses`, `fetchMajorExpenses`.
Screen-managed fetch: `year-comparison.js` manages its own `trendData` state using the same pattern (no Zustand involvement).
- `fetchTransactions` includes a **stale-response guard**: checks `selectedMonth`/`selectedYear` still match before applying network data (discards result if user navigated away mid-fetch).

#### Write queue (addExpense / addIncome only)
When `isOffline` is true:
- A temp item is created with ID `_offline_<timestamp>` (string, not a number — sort logic handles mixed types)
- Applied to the store optimistically so the UI reflects it immediately
- Enqueued to AsyncStorage for later sync
- Returns without setting `isLoading` (the optimistic update is instant)

Updates and deletes are NOT queued — they fail naturally with a network error when offline.

#### NetInfo wiring (`app/_layout.js`)
- One `useEffect` on mount calls `NetInfo.fetch()` and flushes the queue if already online (handles items queued in a previous offline session).
- A second `useEffect` subscribes to `NetInfo.addEventListener`; tracks `prevConnected` to detect the offline→online transition and trigger a flush.

### Year-over-Year Comparison (`app/year-comparison.js`)

Compares expenses, income, and savings across any two calendar years via a grouped bar chart.

#### Layout
- **Mode tab bar** (Expenses / Income / Savings) + horizontal pager — same pattern as `monthly-trends.js`.
- **Year picker bar** — sits between the tab bar and pager. Two pill dropdowns (`[2026 ▾] vs [2025 ▾]`), each opening a shared modal listing all available years. Selection is screen-level state and persists across tab switches.
- **Chart card** — grouped bar chart (12 month groups, Jan–Dec). Left bar = prior year (muted, `color + '55'`), right bar = current year (solid). Pure RN `View` elements, no SVG or chart library.
- **Summary card** — 3-column table (label | prior year | current year) for Total and Avg/Month rows, then a separator and two `StatRow`s (Difference + Percentage) with icons below.

#### Data & caching
- Calls `transactionService.fetchAllMonthlySummaries(userId)` — fetches all rows from `monthly_expense_summaries` and `monthly_income_summaries` with no year filter. Returns `{ year, month, totalExpense, totalIncome, savings }[]` ordered oldest → newest.
- Row count is bounded (12 rows/year) so fetching all history is always fast.
- Uses stale-while-revalidate via `offlineCache.loadSummaries()` / `offlineCache.saveSummaries()` (`@cache_summaries` key). Cache is shown instantly; network data replaces it in the background.
- Screen manages its own `trendData` state — no Zustand store involvement.

#### Chart interaction
- `PanResponder` drag-to-inspect: determines touched group (month) and bar side (prior = left of group center, current = right) from `locationX`.
- Only the touched bar is highlighted; all others (including the partner bar in the same group) dim to 0.25 opacity.
- Single tooltip above the touched bar showing year label + amount. Positioned left-of-center for prior bar, right-of-center for current bar.
- Touch guard: `x < Y_LABEL_WIDTH` returns early — prevents Jan tooltip appearing when tapping the y-axis label area.

#### Year picker
- Available years derived from data (`byYear` keys), sorted descending.
- `selectedCurrentYear` / `selectedPriorYear` initialised to the two most recent years on data load.
- Any two years can be compared independently — no constraint enforcing them to be adjacent.

### Onboarding Flow (`app/onboarding.js`)

Shown once to new users before the auth screens. Three full-screen slides (horizontal FlatList, pagingEnabled) with transparent PNG illustrations, title, and body text.

- **Persistence**: `AsyncStorage` key `@onboarding_complete` — set to `'true'` on finish or skip.
- **Store flag**: `onboardingDone` in `useBudgetStore` — set at startup (read from AsyncStorage) and updated immediately when the user taps Get Started / Skip so the routing guard in `_layout.js` sees it reactively. Existing users with an active session get `onboardingDone = true` automatically and bypass onboarding.
- **Routing guard** (in `_layout.js`): if `!session && !onboardingDone && segments[0] !== 'onboarding'` → redirect to `/onboarding`. Public routes include `onboarding`, `login`, `signup`, `login-callback`.
- **Per-slide image tuning**: each slide in the `SLIDES` array accepts optional `imageMarginTop` and `imageMarginBottom` to compensate for transparent padding in individual illustration files.
- **Images**: stored in `src/assets/images/onboarding-1.png`, `onboarding-2.png`, `onboarding-3.png` — transparent PNGs so they work on both light and dark backgrounds.

### Auth Flow
Supabase session is bootstrapped in `app/_layout.js`. Session state drives redirect: unauthenticated (onboarding done) → `/login`; unauthenticated (onboarding not done) → `/onboarding`; authenticated on public route → `/(tabs)`. The splash screen is held until **both** fonts and the Supabase session are resolved to avoid a blank white flash on startup.

### Run the App
```
npm start          # Expo dev server (scan QR with Expo Go)
npm run ios        # iOS simulator
npm run android    # Android emulator
```
