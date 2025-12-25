/**
 * Grocery List Service
 * Generate shopping lists from meal plans
 */

const MealPlan = require('../models/mealPlan.model');
const logger = require('../../../common/utils/logger');

class GroceryListService {
  /**
   * Generate grocery list from meal plan
   */
  async generateGroceryList(mealPlanId, options = {}) {
    const {
      servings = 1,
      excludeCategories = [],
      groupByCategory = true,
    } = options;

    const mealPlan = await MealPlan.findById(mealPlanId);
    
    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }

    // Extract all foods from meals
    const foodItems = [];
    
    mealPlan.meals.forEach(meal => {
      if (meal.foods && meal.foods.length > 0) {
        meal.foods.forEach(food => {
          foodItems.push({
            name: food.name,
            quantity: food.quantity * servings,
            unit: food.unit,
            mealType: meal.type,
          });
        });
      }
    });

    // Consolidate duplicate items
    const consolidatedItems = this._consolidateItems(foodItems);

    // Categorize items
    const categorizedList = groupByCategory
      ? this._categorizeItems(consolidatedItems)
      : { uncategorized: consolidatedItems };

    // Filter out excluded categories
    Object.keys(categorizedList).forEach(category => {
      if (excludeCategories.includes(category)) {
        delete categorizedList[category];
      }
    });

    // Calculate totals
    const totalItems = Object.values(categorizedList).reduce(
      (sum, items) => sum + items.length,
      0,
    );

    logger.info(`Generated grocery list from meal plan ${mealPlanId}: ${totalItems} items`);

    return {
      mealPlanId,
      mealPlanName: mealPlan.name,
      servings,
      items: categorizedList,
      totalItems,
      generatedAt: new Date(),
    };
  }

  /**
   * Consolidate duplicate food items
   */
  _consolidateItems(foodItems) {
    const itemMap = new Map();

    foodItems.forEach(food => {
      const key = `${food.name.toLowerCase()}_${food.unit}`;
      
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity += food.quantity;
        existing.mealTypes.add(food.mealType);
      } else {
        itemMap.set(key, {
          name: food.name,
          quantity: food.quantity,
          unit: food.unit,
          mealTypes: new Set([food.mealType]),
        });
      }
    });

    return Array.from(itemMap.values()).map(item => ({
      ...item,
      mealTypes: Array.from(item.mealTypes),
    }));
  }

  /**
   * Categorize food items
   */
  _categorizeItems(items) {
    const categories = {
      produce: [],
      protein: [],
      dairy: [],
      grains: [],
      pantry: [],
      frozen: [],
      beverages: [],
      other: [],
    };

    const categoryKeywords = {
      produce: ['vegetable', 'fruit', 'lettuce', 'spinach', 'tomato', 'onion', 'pepper', 'broccoli', 'carrot', 'apple', 'banana', 'berry', 'orange', 'avocado'],
      protein: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'egg', 'tofu', 'tempeh'],
      dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      grains: ['bread', 'rice', 'pasta', 'oat', 'quinoa', 'tortilla', 'cereal'],
      pantry: ['oil', 'sauce', 'spice', 'flour', 'sugar', 'nut', 'seed', 'honey', 'peanut butter', 'almond butter'],
      frozen: ['frozen'],
      beverages: ['juice', 'water', 'coffee', 'tea', 'protein powder'],
    };

    items.forEach(item => {
      const itemNameLower = item.name.toLowerCase();
      let categorized = false;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => itemNameLower.includes(keyword))) {
          categories[category].push(item);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.other.push(item);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(category => {
      if (categories[category].length === 0) {
        delete categories[category];
      }
    });

    return categories;
  }

  /**
   * Export grocery list to formatted text
   */
  exportToText(groceryList) {
    let text = `Grocery List - ${groceryList.mealPlanName}\n`;
    text += `Generated: ${groceryList.generatedAt.toLocaleDateString()}\n`;
    text += `Servings: ${groceryList.servings}\n`;
    text += `Total Items: ${groceryList.totalItems}\n\n`;

    Object.entries(groceryList.items).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      text += '-'.repeat(40) + '\n';
      
      items.forEach(item => {
        text += `☐ ${item.name} - ${item.quantity}${item.unit}\n`;
      });
      
      text += '\n';
    });

    return text;
  }
}

module.exports = new GroceryListService();

