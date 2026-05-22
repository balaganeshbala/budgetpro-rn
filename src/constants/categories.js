import { colors } from './theme';

const fallbackTheme = colors.light;

export const EXPENSE_CATEGORIES = [
    { value: 'emi', displayName: 'EMI', iconName: 'card', color: fallbackTheme.adaptiveRed },
    { value: 'food', displayName: 'Food', iconName: 'restaurant', color: '#FFA500' }, // orange
    { value: 'holidayTrip', displayName: 'Holiday/Trip', iconName: 'airplane', color: '#FFD700' }, // yellow
    { value: 'housing', displayName: 'Housing', iconName: 'home', color: fallbackTheme.adaptiveGreen },
    { value: 'shopping', displayName: 'Shopping', iconName: 'bag', color: '#98FF98' }, // mint
    { value: 'travel', displayName: 'Travel', iconName: 'bus', color: '#00FFFF' }, // cyan
    { value: 'family', displayName: 'Family', iconName: 'people', color: fallbackTheme.primary },
    { value: 'chargesFees', displayName: 'Charges/Fees', iconName: 'cash-outline', color: '#4B0082' }, // indigo
    { value: 'groceries', displayName: 'Groceries', iconName: 'cart', color: '#800080' }, // purple
    { value: 'healthBeauty', displayName: 'Health/Beauty', iconName: 'heart', color: '#FFC0CB' }, // pink
    { value: 'entertainment', displayName: 'Entertainment', iconName: 'tv', color: '#008080' }, // teal
    { value: 'charityGift', displayName: 'Charity/Gift', iconName: 'gift', color: '#FF1493' }, // systemPink
    { value: 'education', displayName: 'Education', iconName: 'book', color: '#A020F0' }, // systemPurple
    { value: 'vehicle', displayName: 'Vehicle', iconName: 'car', color: '#FFA500' }, // systemOrange
];

export const INCOME_CATEGORIES = [
    { value: 'salary', displayName: 'Salary', iconName: 'briefcase', color: fallbackTheme.adaptiveGreen },
    { value: 'investment', displayName: 'Investment', iconName: 'trending-up', color: fallbackTheme.primary },
    { value: 'business', displayName: 'Business', iconName: 'business', color: '#FFA500' }, // orange
    { value: 'rental', displayName: 'Rental', iconName: 'home', color: '#800080' }, // purple
    { value: 'sideHustle', displayName: 'Side Hustle', iconName: 'laptop', color: fallbackTheme.adaptiveRed },
    { value: 'service', displayName: 'Service', iconName: 'construct', color: '#008080' }, // teal
    { value: 'gift', displayName: 'Gift', iconName: 'gift', color: '#FFC0CB' }, // pink
    { value: 'pension', displayName: 'Pension', iconName: 'person', color: '#4B0082' }, // indigo
    { value: 'interest', displayName: 'Interest', iconName: 'pricetag', color: '#FFD700' }, // yellow
    { value: 'dividend', displayName: 'Dividend', iconName: 'cash', color: '#00FFFF' }, // cyan
    { value: 'royalties', displayName: 'Royalties', iconName: 'musical-notes', color: '#A020F0' }, // purple
    { value: 'refund', displayName: 'Refund', iconName: 'refresh-circle', color: fallbackTheme.success },
    { value: 'benefits', displayName: 'Benefits', iconName: 'shield-checkmark', color: '#98FF98' }, // mint
    { value: 'rewards', displayName: 'Rewards', iconName: 'star', color: '#FFD700' }, // yellow
];

/**
 * Helper to find a full category object by its value/name.
 */
export const getExpenseCategory = (value) => {
    const found = EXPENSE_CATEGORIES.find(c => c.value === value);
    return found || { value: 'unknown', displayName: 'Unknown', iconName: 'help-circle', color: fallbackTheme.secondaryText };
};

/**
 * Helper to find a full category object by its value/name.
 */
export const getIncomeCategory = (value) => {
    const found = INCOME_CATEGORIES.find(c => c.value === value);
    return found || { value: 'other', displayName: 'Other', iconName: 'ellipsis-horizontal-circle', color: fallbackTheme.secondaryText };
};
