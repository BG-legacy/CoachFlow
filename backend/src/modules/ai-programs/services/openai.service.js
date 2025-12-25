/**
 * OpenAI Service
 * Handles interactions with OpenAI API for program generation
 */

const axios = require('axios');
const config = require('../../../common/config');
const logger = require('../../../common/utils/logger');
const AIRequest = require('../../common/models/aiRequest.model');
const { v4: uuidv4 } = require('uuid');

class OpenAIService {
  constructor() {
    this.apiKey = config.openai.apiKey;
    this.model = config.openai.model;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    
    if (!this.apiKey) {
      logger.warn('OpenAI API key not configured. AI features will not be available.');
    }
  }

  /**
   * Generate completion from OpenAI
   */
  async generateCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestId = uuidv4();
    const startTime = Date.now();

    const requestData = {
      model: options.model || this.model,
      messages,
      temperature: options.temperature !== undefined ? options.temperature : config.openai.temperature,
      max_tokens: options.maxTokens || config.openai.maxTokens,
      ...options.additionalParams,
    };

    // Create AI request tracking record
    const aiRequest = new AIRequest({
      requestId,
      service: 'openai',
      model: requestData.model,
      prompt: {
        raw: JSON.stringify(messages),
        systemPrompt: messages.find(m => m.role === 'system')?.content,
        temperature: requestData.temperature,
        maxTokens: requestData.max_tokens,
        otherParams: options.additionalParams,
      },
      performance: {
        requestStartTime: new Date(startTime),
      },
      status: 'pending',
      context: options.context || {},
      relatedEntity: options.relatedEntity,
      metadata: {
        environment: config.env,
        version: config.apiVersion,
      },
    });

    if (options.userId) {
      aiRequest.userId = options.userId;
    }

    try {
      const response = await axios.post(
        this.baseURL,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: options.timeout || 120000, // 120 second default timeout (2 minutes)
        }
      );

      const endTime = Date.now();
      const completion = response.data.choices[0];
      const usage = response.data.usage;

      // Calculate estimated cost (GPT-4 pricing as of 2024)
      const estimatedCost = this.calculateCost(requestData.model, usage);

      // Update AI request tracking
      aiRequest.response = {
        raw: completion.message.content,
        finishReason: completion.finish_reason,
      };
      aiRequest.usage = {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost,
      };
      aiRequest.performance.requestEndTime = new Date(endTime);
      aiRequest.performance.latency = endTime - startTime;
      aiRequest.status = 'success';

      await aiRequest.save();

      logger.info('OpenAI completion generated successfully', {
        requestId,
        model: requestData.model,
        tokens: usage.total_tokens,
        latency: endTime - startTime,
      });

      return {
        content: completion.message.content,
        usage,
        estimatedCost,
        requestId,
        aiRequestId: aiRequest._id,
        latency: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();

      // Update AI request with error
      aiRequest.status = 'error';
      aiRequest.error = {
        code: error.response?.data?.error?.code || error.code,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data,
      };
      aiRequest.performance.requestEndTime = new Date(endTime);
      aiRequest.performance.latency = endTime - startTime;

      await aiRequest.save();

      logger.error('OpenAI API error', {
        requestId,
        error: error.message,
        status: error.response?.status,
      });

      throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Calculate estimated cost based on model and token usage
   */
  calculateCost(model, usage) {
    // Pricing as of 2024 (in USD per 1K tokens)
    const pricing = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
    };

    // Default to gpt-4 pricing if model not found
    const modelPricing = pricing[model] || pricing['gpt-4'];

    const promptCost = (usage.prompt_tokens / 1000) * modelPricing.prompt;
    const completionCost = (usage.completion_tokens / 1000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Parse JSON from completion (handles markdown code blocks)
   */
  parseJSONCompletion(content) {
    try {
      // Try direct parse first
      return JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
      // Try to find JSON object in text
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }
      throw new Error('Could not parse JSON from completion');
    }
  }

  /**
   * Check if OpenAI is enabled and configured
   */
  isEnabled() {
    return config.openai.enabled && !!this.apiKey;
  }
}

module.exports = new OpenAIService();

