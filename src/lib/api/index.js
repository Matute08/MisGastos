export { apiClient, ApiClient } from './client.js';
export { auth } from './auth.js';
export { availableCards, userCards, cards } from './cards.js';
export { expenses } from './expenses.js';
export { categories, subcategories } from './categories.js';
export { incomes } from './incomes.js';
export { savings } from './savings.js';
export { activity } from './activity.js';

import { apiClient } from './client.js';
import { auth } from './auth.js';
import { availableCards, userCards, cards } from './cards.js';
import { expenses } from './expenses.js';
import { categories, subcategories } from './categories.js';
import { incomes } from './incomes.js';
import { savings } from './savings.js';
import { activity } from './activity.js';

export default {
  client: apiClient,
  auth,
  availableCards,
  userCards,
  cards,
  expenses,
  categories,
  subcategories,
  incomes,
  savings,
  activity
};
