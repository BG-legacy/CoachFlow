/**
 * Configuration Loader
 * Loads and merges environment-specific configuration with base config
 */

const path = require('path');
const fs = require('fs');

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Load environment-specific configuration
 * @param {string} env - Environment name (development, staging, production)
 * @returns {object} Environment-specific config or empty object if not found
 */
function loadEnvironmentConfig(env) {
  const envConfigPath = path.join(__dirname, 'environments', `${env}.js`);

  try {
    if (fs.existsSync(envConfigPath)) {
      const envConfig = require(envConfigPath);
      return envConfig;
    }
  } catch (error) {
    console.warn(`Warning: Could not load environment config for '${env}':`, error.message);
  }

  return {};
}

/**
 * Apply environment-specific overrides to base config
 * @param {object} baseConfig - Base configuration object
 * @returns {object} Merged configuration
 */
function applyEnvironmentOverrides(baseConfig) {
  const env = baseConfig.env || 'development';
  const envConfig = loadEnvironmentConfig(env);

  // Merge environment-specific config with base config
  // Environment config takes precedence
  const mergedConfig = deepMerge(baseConfig, envConfig);

  return mergedConfig;
}

module.exports = {
  loadEnvironmentConfig,
  applyEnvironmentOverrides,
  deepMerge,
};
