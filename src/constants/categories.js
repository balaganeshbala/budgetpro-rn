import { colors } from './theme';

const fallbackTheme = colors.light;

export const EXPENSE_CATEGORIES = [
    { value: 'emi', displayName: 'EMI', iconName: 'card', color: '#FF9F0A' },
    { value: 'food', displayName: 'Food', iconName: 'restaurant', color: '#FF9500' },
    { value: 'holidayTrip', displayName: 'Holiday/Trip', iconName: 'airplane', color: '#FFCC00' },
    { value: 'housing', displayName: 'Housing', iconName: 'home', color: '#34C759' },
    { value: 'shopping', displayName: 'Shopping', iconName: 'bag', color: '#FF375F' },
    { value: 'travel', displayName: 'Travel', iconName: 'bus', color: '#32ADE6' },
    { value: 'family', displayName: 'Family', iconName: 'people', color: '#007AFF' },
    { value: 'chargesFees', displayName: 'Charges/Fees', iconName: 'cash-outline', color: '#8E8E93' },
    { value: 'groceries', displayName: 'Groceries', iconName: 'cart', color: '#00C7BE' },
    { value: 'healthBeauty', displayName: 'Health/Beauty', iconName: 'heart', color: '#AF52DE' },
    { value: 'entertainment', displayName: 'Entertainment', iconName: 'tv', color: '#30B0C7' },
    { value: 'charityGift', displayName: 'Charity/Gift', iconName: 'gift', color: '#FF6348' },
    { value: 'education', displayName: 'Education', iconName: 'book', color: '#5856D6' },
    { value: 'vehicle', displayName: 'Vehicle', iconName: 'car', color: '#A2845E' },
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

export const MAJOR_EXPENSE_CATEGORIES = [
    { value: 'vehicle', displayName: 'Vehicle', iconName: 'car', color: '#FF9500' },
    { value: 'homeRenovation', displayName: 'Home Renovation', iconName: 'hammer', color: '#A2845E' },
    { value: 'medical', displayName: 'Medical', iconName: 'medkit', color: '#FF3B30' },
    { value: 'education', displayName: 'Education', iconName: 'school', color: '#AF52DE' },
    { value: 'appliances', displayName: 'Appliances', iconName: 'flash', color: '#8E8E93' },
    { value: 'electronics', displayName: 'Electronics', iconName: 'tv', color: '#007AFF' },
    { value: 'furniture', displayName: 'Furniture', iconName: 'bed', color: '#A2845E' },
    { value: 'event', displayName: 'Event', iconName: 'star', color: '#FF2D55' },
    { value: 'travel', displayName: 'Travel', iconName: 'airplane', color: '#00C7BE' },
    { value: 'legal', displayName: 'Legal', iconName: 'document-text', color: '#5856D6' },
    { value: 'disasterRecovery', displayName: 'Disaster Recovery', iconName: 'warning', color: '#FF3B30' },
    { value: 'relocation', displayName: 'Relocation', iconName: 'navigate', color: '#34C759' },
    { value: 'family', displayName: 'Family', iconName: 'people', color: '#007AFF' },
    { value: 'gift', displayName: 'Gift', iconName: 'gift', color: '#FF2D55' },
    { value: 'taxes', displayName: 'Taxes', iconName: 'receipt', color: '#FFCC00' },
    { value: 'debtSettlement', displayName: 'Debt Settlement', iconName: 'card', color: '#FF3B30' },
    { value: 'donation', displayName: 'Donation', iconName: 'heart-circle', color: '#34C759' },
    { value: 'other', displayName: 'Other', iconName: 'ellipsis-horizontal-circle', color: '#8E8E93' },
];

export const getMajorExpenseCategory = (value) => {
    const found = MAJOR_EXPENSE_CATEGORIES.find(c => c.value === value);
    return found || { value: 'other', displayName: 'Other', iconName: 'ellipsis-horizontal-circle', color: '#8E8E93' };
};
