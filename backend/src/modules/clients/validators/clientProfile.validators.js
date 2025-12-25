/**
 * Client Profile Validators
 * Validation rules for onboarding and profile management
 */

const { body, param } = require('express-validator');

/**
 * Onboarding Step 1: Goals
 */
const validateGoals = [
  body('fitnessProfile.primaryGoal')
    .notEmpty()
    .withMessage('Primary goal is required')
    .isIn(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness', 'sports_performance', 'rehabilitation'])
    .withMessage('Invalid primary goal'),
  body('fitnessProfile.goals')
    .isArray({ min: 1 })
    .withMessage('At least one fitness goal is required'),
  body('fitnessProfile.goals.*')
    .isIn(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness', 'sports_performance', 'rehabilitation'])
    .withMessage('Invalid goal type'),
  body('fitnessProfile.targetWeight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Target weight must be between 30 and 300 kg'),
];

/**
 * Onboarding Step 2: Experience Level
 */
const validateExperience = [
  body('fitnessProfile.experienceLevel')
    .notEmpty()
    .withMessage('Experience level is required')
    .isIn(['beginner', 'intermediate', 'advanced', 'elite'])
    .withMessage('Invalid experience level'),
  body('fitnessProfile.activityLevel')
    .optional()
    .isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .withMessage('Invalid activity level'),
  body('fitnessProfile.yearsOfTraining')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Years of training must be between 0 and 100'),
  body('fitnessProfile.previousPrograms')
    .optional()
    .isArray()
    .withMessage('Previous programs must be an array'),
];

/**
 * Onboarding Step 3: Equipment
 */
const validateEquipment = [
  body('equipment.hasGymAccess')
    .notEmpty()
    .withMessage('Gym access information is required')
    .isBoolean()
    .withMessage('Gym access must be a boolean'),
  body('equipment.gymName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Gym name must not exceed 200 characters'),
  body('equipment.homeEquipment')
    .optional()
    .isArray()
    .withMessage('Home equipment must be an array'),
  body('equipment.homeEquipment.*')
    .optional()
    .isIn([
      'none', 'dumbbells', 'barbells', 'kettlebells', 'resistance_bands',
      'pull_up_bar', 'bench', 'squat_rack', 'cable_machine', 'cardio_machine',
      'yoga_mat', 'foam_roller', 'medicine_ball', 'suspension_trainer', 'other',
    ])
    .withMessage('Invalid equipment type'),
  body('equipment.equipmentNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Equipment notes must not exceed 500 characters'),
];

/**
 * Onboarding Step 4: Schedule
 */
const validateSchedule = [
  body('schedule.availableDays')
    .isArray({ min: 1 })
    .withMessage('At least one available day is required'),
  body('schedule.availableDays.*')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('schedule.preferredTimeOfDay')
    .optional()
    .isIn(['early_morning', 'morning', 'midday', 'afternoon', 'evening', 'night'])
    .withMessage('Invalid preferred time of day'),
  body('schedule.sessionDuration')
    .notEmpty()
    .withMessage('Session duration is required')
    .isInt({ min: 15, max: 180 })
    .withMessage('Session duration must be between 15 and 180 minutes'),
  body('schedule.sessionsPerWeek')
    .notEmpty()
    .withMessage('Sessions per week is required')
    .isInt({ min: 1, max: 7 })
    .withMessage('Sessions per week must be between 1 and 7'),
  body('schedule.timeZone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Time zone must not exceed 100 characters'),
];

/**
 * Onboarding Step 5: Injuries & Limitations
 */
const validateLimitations = [
  body('medicalInfo.injuries')
    .optional()
    .isArray()
    .withMessage('Injuries must be an array'),
  body('medicalInfo.chronicConditions')
    .optional()
    .isArray()
    .withMessage('Chronic conditions must be an array'),
  body('medicalInfo.medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medicalInfo.limitations')
    .optional()
    .isArray()
    .withMessage('Limitations must be an array'),
  body('medicalInfo.doctorClearance')
    .optional()
    .isBoolean()
    .withMessage('Doctor clearance must be a boolean'),
  body('medicalInfo.notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medical notes must not exceed 1000 characters'),
];

/**
 * Onboarding Step 6: Nutrition
 */
const validateNutrition = [
  body('nutritionPreferences.dietType')
    .optional()
    .isIn(['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'intermittent_fasting', 'flexible_dieting', 'other'])
    .withMessage('Invalid diet type'),
  body('nutritionPreferences.dietaryRestrictions')
    .optional()
    .isArray()
    .withMessage('Dietary restrictions must be an array'),
  body('nutritionPreferences.foodAllergies')
    .optional()
    .isArray()
    .withMessage('Food allergies must be an array'),
  body('nutritionPreferences.foodAllergies.*.allergen')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Allergen name must not exceed 200 characters'),
  body('nutritionPreferences.foodAllergies.*.severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'life_threatening'])
    .withMessage('Invalid allergy severity'),
  body('nutritionPreferences.foodDislikes')
    .optional()
    .isArray()
    .withMessage('Food dislikes must be an array'),
  body('nutritionPreferences.calorieTarget')
    .optional()
    .isInt({ min: 1000, max: 10000 })
    .withMessage('Calorie target must be between 1000 and 10000'),
  body('nutritionPreferences.mealsPerDay')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Meals per day must be between 1 and 8'),
  body('nutritionPreferences.waterIntakeGoal')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Water intake goal must be between 0 and 10 liters'),
  body('nutritionPreferences.nutritionNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Nutrition notes must not exceed 1000 characters'),
];

/**
 * Profile update validation
 */
const validateProfileUpdate = [
  body('personalInfo.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth'),
  body('personalInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender'),
  body('personalInfo.height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),
  body('personalInfo.weight')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Weight must be between 30 and 300 kg'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'on_hold', 'completed'])
    .withMessage('Invalid status'),
];

/**
 * Constraint update validation (for trainers)
 */
const validateConstraintUpdate = [
  body('field')
    .notEmpty()
    .withMessage('Field name is required')
    .isString()
    .withMessage('Field must be a string'),
  body('value')
    .notEmpty()
    .withMessage('Value is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

/**
 * Validate ObjectId parameter
 */
const validateProfileId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid profile ID'),
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
];

module.exports = {
  validateGoals,
  validateExperience,
  validateEquipment,
  validateSchedule,
  validateLimitations,
  validateNutrition,
  validateProfileUpdate,
  validateConstraintUpdate,
  validateProfileId,
  validateUserId,
};

