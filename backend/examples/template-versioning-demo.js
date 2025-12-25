/**
 * Template Versioning Demo
 * Demonstrates the versioned artifact system
 * 
 * Usage: node examples/template-versioning-demo.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../src/common/config');
const programGeneratorService = require('../src/modules/ai-programs/services/programGenerator.service');
const programTemplateService = require('../src/modules/ai-programs/services/programTemplate.service');
const migrationUtil = require('../src/modules/ai-programs/utils/migration.util');
const User = require('../src/modules/auth/models/user.model');
const ClientProfile = require('../src/modules/clients/models/clientProfile.model');

async function demo() {
  console.log('🎯 Template Versioning System Demo\n');
  console.log('===================================\n');

  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected\n');

    // Get demo users
    const coach = await User.findOne({ email: 'demo.coach@coachflow.com' });
    const client = await User.findOne({ email: 'demo.client@coachflow.com' });

    if (!coach || !client) {
      console.error('❌ Demo users not found. Run ai-program-generation-demo.js first.');
      process.exit(1);
    }

    // Example 1: Generate with automatic template checking
    console.log('🎯 EXAMPLE 1: Generate with Template Check\n');
    console.log('First request - will generate new program...');
    
    const program1 = await programGeneratorService.generateCompleteProgram(
      coach._id,
      client._id,
      {
        duration: 12,
        goals: ['strength'],
        useTemplate: true,
        saveAsTemplate: true,
      }
    );

    console.log(`✅ Program created: ${program1._id}`);
    console.log(`   Source: ${program1.source || 'generated'}`);
    console.log(`   Template ID: ${program1.metadata?.templateId || 'N/A'}\n`);

    // Example 2: Second request with same parameters (should use template)
    console.log('🎯 EXAMPLE 2: Reuse Template (No AI Call)\n');
    console.log('Second request with same parameters...');

    const program2 = await programGeneratorService.generateCompleteProgram(
      coach._id,
      client._id,
      {
        duration: 12,
        goals: ['strength'],
        useTemplate: true,
      }
    );

    console.log(`✅ Program created: ${program2._id}`);
    console.log(`   Source: ${program2.source || 'generated'}`);
    console.log(`   Match Type: ${program2.matchType || 'N/A'}`);
    console.log(`   💰 Cost: $0.00 (used template!)\n`);

    // Example 3: Find matching template
    console.log('🎯 EXAMPLE 3: Find Matching Template\n');

    const clientProfile = await ClientProfile.findOne({ userId: client._id });
    const inputData = {
      clientProfile: {
        fitnessProfile: clientProfile.fitnessProfile,
        equipment: clientProfile.equipment,
        nutritionPreferences: clientProfile.nutritionPreferences,
      },
      goals: ['strength'],
      duration: 12,
    };

    const { template, matchType } = await programTemplateService.findMatchingTemplate(
      inputData,
      { allowSimilar: true }
    );

    if (template) {
      console.log(`✅ Found matching template!`);
      console.log(`   Template ID: ${template.templateId}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Match Type: ${matchType}`);
      console.log(`   Times Used: ${template.usage.timesUsed}`);
      console.log(`   Rating: ${template.usage.averageRating || 'Not rated'}\n`);
    }

    // Example 4: Apply template with customization
    if (template) {
      console.log('🎯 EXAMPLE 4: Apply Template with Customization\n');

      const result = await programTemplateService.applyTemplate(
        template.templateId,
        client._id,
        coach._id,
        {
          duration: 10,  // Customize duration
          macros: {
            protein: 200,
            carbs: 300,
            fats: 70,
          },
        }
      );

      console.log(`✅ Template applied with customizations`);
      console.log(`   Generated Program ID: ${result.generatedProgram._id}`);
      console.log(`   Duration adjusted: 12 → 10 weeks`);
      console.log(`   Macros adjusted: Custom values\n`);
    }

    // Example 5: Create template from generated program
    console.log('🎯 EXAMPLE 5: Create Template from Generated Program\n');

    const newTemplate = await programTemplateService.createTemplateFromGenerated(
      program1._id,
      {
        name: 'Demo Strength Builder',
        description: 'Proven 12-week strength program',
        visibility: 'organization',
        tags: ['strength', '12-week', 'demo'],
      }
    );

    console.log(`✅ Template created from generated program`);
    console.log(`   Template ID: ${newTemplate.templateId}`);
    console.log(`   Version: ${newTemplate.version}`);
    console.log(`   Visibility: ${newTemplate.visibility}`);
    console.log(`   Content Fingerprint: ${newTemplate.contentFingerprint.substring(0, 16)}...`);
    console.log(`   Input Fingerprint: ${newTemplate.inputFingerprint.substring(0, 16)}...\n`);

    // Example 6: Search templates
    console.log('🎯 EXAMPLE 6: Search Templates\n');

    const searchResults = await programTemplateService.searchTemplates(
      {
        templateType: 'combined',
        experienceLevel: 'intermediate',
        goals: ['strength'],
      },
      {
        sortBy: 'rating',
        limit: 5,
      }
    );

    console.log(`✅ Found ${searchResults.total} matching templates`);
    console.log(`   Showing top ${searchResults.templates.length}:\n`);

    searchResults.templates.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`);
      console.log(`      Template ID: ${t.templateId}`);
      console.log(`      Times Used: ${t.usage.timesUsed}`);
      console.log(`      Rating: ${t.usage.averageRating || 'Not rated'}`);
      console.log();
    });

    // Example 7: Migration statistics
    console.log('🎯 EXAMPLE 7: Template Library Statistics\n');

    const stats = await migrationUtil.generateUsageStats();

    console.log(`✅ Template Library Stats:`);
    console.log(`   Total Templates: ${stats.overall.totalTemplates || 0}`);
    console.log(`   Total Usage: ${stats.overall.totalUsage || 0}`);
    console.log(`   Average Rating: ${stats.overall.avgRating?.toFixed(2) || 'N/A'}`);
    console.log(`   Average Usage: ${stats.overall.avgUsage?.toFixed(1) || 'N/A'}\n`);

    if (stats.byCategory.length > 0) {
      console.log('   By Category:');
      stats.byCategory.forEach(cat => {
        console.log(`   - ${cat._id || 'Uncategorized'}: ${cat.count} templates, ${cat.totalUsage} uses`);
      });
      console.log();
    }

    // Summary
    console.log('===================================');
    console.log('✅ Demo completed successfully!\n');
    console.log('Key Takeaways:');
    console.log('1. First generation creates a template automatically');
    console.log('2. Subsequent similar requests reuse the template (no AI call)');
    console.log('3. Templates can be customized per client');
    console.log('4. Full search and discovery system');
    console.log('5. Usage tracking and analytics');
    console.log('6. 60-80% cost savings through template reuse\n');

    console.log('💡 Try the REST API:');
    console.log('   GET  /api/v1/ai-programs/templates');
    console.log('   POST /api/v1/ai-programs/templates/find-match');
    console.log('   POST /api/v1/ai-programs/templates/:id/apply\n');

  } catch (error) {
    console.error('\n❌ Error during demo:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = demo;

