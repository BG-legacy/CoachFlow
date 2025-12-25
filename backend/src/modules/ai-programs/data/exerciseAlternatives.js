/**
 * Exercise Alternatives Database
 * Defines exercise equivalencies and substitutions for equipment, difficulty, or injury
 */

const exerciseAlternatives = {
  // CHEST EXERCISES
  'bench_press': {
    primary: {
      muscleGroup: 'chest',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'dumbbell_bench_press',
        reason: 'equipment',
        similarity: 0.95,
        equipment: ['dumbbells', 'bench'],
        notes: 'Greater range of motion, unilateral strength',
      },
      {
        exercise: 'push_ups',
        reason: 'equipment',
        similarity: 0.75,
        equipment: ['bodyweight'],
        notes: 'Bodyweight alternative, can add resistance',
      },
      {
        exercise: 'dumbbell_floor_press',
        reason: 'equipment',
        similarity: 0.85,
        equipment: ['dumbbells'],
        notes: 'No bench required, reduced shoulder stress',
      },
      {
        exercise: 'machine_chest_press',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['machine'],
        notes: 'Safer for shoulder injuries, guided motion',
      },
    ],
  },
  
  'incline_bench_press': {
    primary: {
      muscleGroup: 'chest',
      emphasis: 'upper_chest',
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'incline_dumbbell_press',
        reason: 'equipment',
        similarity: 0.95,
        equipment: ['dumbbells', 'bench'],
      },
      {
        exercise: 'pike_push_ups',
        reason: 'equipment',
        similarity: 0.70,
        equipment: ['bodyweight'],
      },
      {
        exercise: 'incline_machine_press',
        reason: 'injury',
        similarity: 0.85,
        equipment: ['machine'],
      },
    ],
  },

  'dumbbell_flyes': {
    primary: {
      muscleGroup: 'chest',
      type: 'isolation',
      equipment: ['dumbbells', 'bench'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'cable_flyes',
        reason: 'equipment',
        similarity: 0.90,
        equipment: ['cable'],
        notes: 'Constant tension, better for chest pump',
      },
      {
        exercise: 'pec_deck',
        reason: 'injury',
        similarity: 0.85,
        equipment: ['machine'],
        notes: 'Safer for shoulder issues',
      },
      {
        exercise: 'resistance_band_flyes',
        reason: 'equipment',
        similarity: 0.80,
        equipment: ['resistance_bands'],
      },
    ],
  },

  // BACK EXERCISES
  'barbell_row': {
    primary: {
      muscleGroup: 'back',
      emphasis: 'lats',
      equipment: ['barbell'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'dumbbell_row',
        reason: 'equipment',
        similarity: 0.90,
        equipment: ['dumbbells'],
        notes: 'Unilateral, reduces lower back stress',
      },
      {
        exercise: 'inverted_row',
        reason: 'equipment',
        similarity: 0.80,
        equipment: ['bodyweight', 'bar'],
        notes: 'Bodyweight alternative, great for beginners',
      },
      {
        exercise: 'cable_row',
        reason: 'injury',
        similarity: 0.85,
        equipment: ['cable'],
        notes: 'Reduced spinal loading',
      },
      {
        exercise: 'machine_row',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['machine'],
        notes: 'Most stable, best for back injuries',
      },
    ],
  },

  'pull_ups': {
    primary: {
      muscleGroup: 'back',
      emphasis: 'lats',
      equipment: ['pull_up_bar'],
      difficulty: 'advanced',
    },
    alternatives: [
      {
        exercise: 'lat_pulldown',
        reason: 'difficulty',
        similarity: 0.90,
        equipment: ['cable', 'machine'],
        notes: 'Easier progression, adjustable weight',
      },
      {
        exercise: 'assisted_pull_ups',
        reason: 'difficulty',
        similarity: 0.95,
        equipment: ['machine', 'resistance_bands'],
        notes: 'Perfect for building up to full pull-ups',
      },
      {
        exercise: 'resistance_band_pull_downs',
        reason: 'equipment',
        similarity: 0.75,
        equipment: ['resistance_bands'],
      },
    ],
  },

  'deadlift': {
    primary: {
      muscleGroup: 'back',
      type: 'compound',
      equipment: ['barbell'],
      difficulty: 'advanced',
    },
    alternatives: [
      {
        exercise: 'trap_bar_deadlift',
        reason: 'injury',
        similarity: 0.90,
        equipment: ['trap_bar'],
        notes: 'Easier on lower back, more quad-dominant',
      },
      {
        exercise: 'romanian_deadlift',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['barbell', 'dumbbells'],
        notes: 'Less spinal loading, hamstring focus',
      },
      {
        exercise: 'rack_pulls',
        reason: 'injury',
        similarity: 0.75,
        equipment: ['barbell'],
        notes: 'Reduced range of motion, upper back focus',
      },
    ],
  },

  // LEG EXERCISES
  'barbell_squat': {
    primary: {
      muscleGroup: 'legs',
      emphasis: 'quads',
      equipment: ['barbell', 'rack'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'goblet_squat',
        reason: 'equipment',
        similarity: 0.85,
        equipment: ['dumbbell', 'kettlebell'],
        notes: 'Easier to learn, front-loaded',
      },
      {
        exercise: 'bulgarian_split_squat',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['dumbbells'],
        notes: 'Unilateral, less spinal loading',
      },
      {
        exercise: 'leg_press',
        reason: 'injury',
        similarity: 0.75,
        equipment: ['machine'],
        notes: 'Safest for back issues',
      },
      {
        exercise: 'bodyweight_squat',
        reason: 'equipment',
        similarity: 0.65,
        equipment: ['bodyweight'],
        notes: 'No equipment needed',
      },
    ],
  },

  'leg_press': {
    primary: {
      muscleGroup: 'legs',
      equipment: ['machine'],
      difficulty: 'beginner',
    },
    alternatives: [
      {
        exercise: 'barbell_squat',
        reason: 'progression',
        similarity: 0.80,
        equipment: ['barbell'],
        notes: 'Free weight progression',
      },
      {
        exercise: 'hack_squat',
        reason: 'equipment',
        similarity: 0.90,
        equipment: ['machine'],
      },
    ],
  },

  'lunges': {
    primary: {
      muscleGroup: 'legs',
      type: 'unilateral',
      equipment: ['dumbbells'],
      difficulty: 'beginner',
    },
    alternatives: [
      {
        exercise: 'bulgarian_split_squat',
        reason: 'progression',
        similarity: 0.85,
        equipment: ['dumbbells'],
        notes: 'More challenging, elevated rear foot',
      },
      {
        exercise: 'step_ups',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['dumbbells', 'box'],
        notes: 'Less knee stress',
      },
      {
        exercise: 'walking_lunges',
        reason: 'variation',
        similarity: 0.95,
        equipment: ['dumbbells'],
      },
    ],
  },

  // SHOULDER EXERCISES
  'overhead_press': {
    primary: {
      muscleGroup: 'shoulders',
      equipment: ['barbell'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'dumbbell_shoulder_press',
        reason: 'equipment',
        similarity: 0.95,
        equipment: ['dumbbells'],
        notes: 'Greater ROM, unilateral strength',
      },
      {
        exercise: 'seated_shoulder_press',
        reason: 'injury',
        similarity: 0.90,
        equipment: ['dumbbells', 'bench'],
        notes: 'Reduces lower back involvement',
      },
      {
        exercise: 'pike_push_ups',
        reason: 'equipment',
        similarity: 0.75,
        equipment: ['bodyweight'],
      },
      {
        exercise: 'machine_shoulder_press',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['machine'],
      },
    ],
  },

  'lateral_raises': {
    primary: {
      muscleGroup: 'shoulders',
      emphasis: 'side_delts',
      type: 'isolation',
      equipment: ['dumbbells'],
      difficulty: 'beginner',
    },
    alternatives: [
      {
        exercise: 'cable_lateral_raises',
        reason: 'equipment',
        similarity: 0.90,
        equipment: ['cable'],
        notes: 'Constant tension',
      },
      {
        exercise: 'resistance_band_lateral_raises',
        reason: 'equipment',
        similarity: 0.85,
        equipment: ['resistance_bands'],
      },
      {
        exercise: 'machine_lateral_raises',
        reason: 'injury',
        similarity: 0.85,
        equipment: ['machine'],
      },
    ],
  },

  // ARM EXERCISES
  'barbell_curl': {
    primary: {
      muscleGroup: 'biceps',
      equipment: ['barbell'],
      difficulty: 'beginner',
    },
    alternatives: [
      {
        exercise: 'dumbbell_curl',
        reason: 'equipment',
        similarity: 0.95,
        equipment: ['dumbbells'],
        notes: 'Better ROM, reduced elbow stress',
      },
      {
        exercise: 'hammer_curl',
        reason: 'injury',
        similarity: 0.85,
        equipment: ['dumbbells'],
        notes: 'Easier on wrists',
      },
      {
        exercise: 'cable_curl',
        reason: 'equipment',
        similarity: 0.90,
        equipment: ['cable'],
      },
      {
        exercise: 'resistance_band_curl',
        reason: 'equipment',
        similarity: 0.80,
        equipment: ['resistance_bands'],
      },
    ],
  },

  'tricep_dips': {
    primary: {
      muscleGroup: 'triceps',
      equipment: ['parallel_bars'],
      difficulty: 'intermediate',
    },
    alternatives: [
      {
        exercise: 'bench_dips',
        reason: 'difficulty',
        similarity: 0.85,
        equipment: ['bench'],
        notes: 'Easier progression',
      },
      {
        exercise: 'close_grip_bench_press',
        reason: 'injury',
        similarity: 0.80,
        equipment: ['barbell', 'bench'],
        notes: 'Less shoulder stress',
      },
      {
        exercise: 'tricep_pushdowns',
        reason: 'equipment',
        similarity: 0.85,
        equipment: ['cable'],
      },
      {
        exercise: 'overhead_tricep_extension',
        reason: 'variation',
        similarity: 0.80,
        equipment: ['dumbbell'],
      },
    ],
  },

  // CORE EXERCISES
  'hanging_leg_raises': {
    primary: {
      muscleGroup: 'core',
      emphasis: 'lower_abs',
      equipment: ['pull_up_bar'],
      difficulty: 'advanced',
    },
    alternatives: [
      {
        exercise: 'lying_leg_raises',
        reason: 'difficulty',
        similarity: 0.85,
        equipment: ['mat'],
        notes: 'Easier progression',
      },
      {
        exercise: 'reverse_crunches',
        reason: 'difficulty',
        similarity: 0.80,
        equipment: ['mat'],
      },
      {
        exercise: 'ab_wheel',
        reason: 'variation',
        similarity: 0.75,
        equipment: ['ab_wheel'],
      },
    ],
  },

  'plank': {
    primary: {
      muscleGroup: 'core',
      type: 'isometric',
      equipment: ['bodyweight'],
      difficulty: 'beginner',
    },
    alternatives: [
      {
        exercise: 'side_plank',
        reason: 'variation',
        similarity: 0.85,
        equipment: ['bodyweight'],
        notes: 'Targets obliques',
      },
      {
        exercise: 'dead_bug',
        reason: 'injury',
        similarity: 0.75,
        equipment: ['bodyweight'],
        notes: 'Better for back pain',
      },
      {
        exercise: 'bird_dog',
        reason: 'injury',
        similarity: 0.70,
        equipment: ['bodyweight'],
      },
    ],
  },
};

/**
 * Get alternatives for a specific exercise
 */
function getAlternatives(exerciseName, filterOptions = {}) {
  const normalized = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const exercise = exerciseAlternatives[normalized];
  
  if (!exercise) {
    return null;
  }

  let alternatives = exercise.alternatives;

  // Filter by reason
  if (filterOptions.reason) {
    alternatives = alternatives.filter(alt => alt.reason === filterOptions.reason);
  }

  // Filter by equipment availability
  if (filterOptions.availableEquipment) {
    alternatives = alternatives.filter(alt => 
      alt.equipment.every(eq => filterOptions.availableEquipment.includes(eq))
    );
  }

  // Filter by similarity threshold
  if (filterOptions.minSimilarity) {
    alternatives = alternatives.filter(alt => alt.similarity >= filterOptions.minSimilarity);
  }

  // Sort by similarity
  alternatives.sort((a, b) => b.similarity - a.similarity);

  return {
    original: {
      exercise: exerciseName,
      ...exercise.primary,
    },
    alternatives,
  };
}

/**
 * Find best alternative based on criteria
 */
function findBestAlternative(exerciseName, criteria = {}) {
  const alternatives = getAlternatives(exerciseName, criteria);
  
  if (!alternatives || alternatives.alternatives.length === 0) {
    return null;
  }

  return {
    original: alternatives.original,
    recommended: alternatives.alternatives[0],
    otherOptions: alternatives.alternatives.slice(1),
  };
}

/**
 * Get all exercises by muscle group
 */
function getExercisesByMuscleGroup(muscleGroup) {
  return Object.entries(exerciseAlternatives)
    .filter(([_, data]) => data.primary.muscleGroup === muscleGroup)
    .map(([name, data]) => ({
      name,
      ...data.primary,
    }));
}

module.exports = {
  exerciseAlternatives,
  getAlternatives,
  findBestAlternative,
  getExercisesByMuscleGroup,
};


