/**
 * Grocery List Controller
 */

const groceryListService = require('../services/groceryList.service');

class GroceryListController {
  async generateGroceryList(req, res, next) {
    try {
      const { mealPlanId } = req.params;
      const { servings, excludeCategories, groupByCategory } = req.query;

      const groceryList = await groceryListService.generateGroceryList(mealPlanId, {
        servings: parseInt(servings) || 1,
        excludeCategories: excludeCategories ? excludeCategories.split(',') : [],
        groupByCategory: groupByCategory !== 'false',
      });

      res.json({ success: true, data: groceryList });
    } catch (error) {
      next(error);
    }
  }

  async exportGroceryList(req, res, next) {
    try {
      const { mealPlanId } = req.params;
      const { servings } = req.query;

      const groceryList = await groceryListService.generateGroceryList(mealPlanId, {
        servings: parseInt(servings) || 1,
      });

      const text = groceryListService.exportToText(groceryList);

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="grocery-list-${Date.now()}.txt"`,
      );
      res.send(text);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GroceryListController();

