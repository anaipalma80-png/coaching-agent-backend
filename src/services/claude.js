const axios = require('axios');
const { getConfig } = require('../config/env');
const logger = require('../utils/logger');

const config = getConfig();

/**
 * Claude AI Service - Conversation analysis and insights generation
 */
class ClaudeService {
  constructor() {
    this.client = axios.create({
      baseURL: config.claude.apiUrl,
      headers: {
        'x-api-key': config.claude.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.model = 'claude-3-sonnet-20240229';
  }

  /**
   * Analyze conversation transcript
   */
  async analyzeConversation(transcript, context = {}) {
    try {
      const prompt = this.buildAnalysisPrompt(transcript, context);

      logger.debug({ transcriptLength: transcript.length }, 'Analyzing conversation with Claude');

      const response = await this.client.post('/messages', {
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysis = this.parseAnalysisResponse(response.data.content[0].text);

      logger.info({ sentimentScore: analysis.sentiment_score }, 'Conversation analysis completed');

      return analysis;
    } catch (error) {
      logger.error(
        { error: error.message, status: error.response?.status },
        'Failed to analyze conversation with Claude'
      );
      throw new Error(`Failed to analyze conversation with Claude: ${error.message}`);
    }
  }

  /**
   * Generate coaching insights
   */
  async generateCoachingInsights(transcript, coachingContext = {}) {
    try {
      const prompt = this.buildCoachingPrompt(transcript, coachingContext);

      logger.debug({ contextKeys: Object.keys(coachingContext) }, 'Generating coaching insights');

      const response = await this.client.post('/messages', {
        model: this.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const insights = this.parseInsightsResponse(response.data.content[0].text);

      logger.info('Coaching insights generated successfully');

      return insights;
    } catch (error) {
      logger.error(
        { error: error.message, status: error.response?.status },
        'Failed to generate coaching insights'
      );
      throw new Error(`Failed to generate coaching insights: ${error.message}`);
    }
  }

  buildAnalysisPrompt(transcript, context) {
    return `Analyze the following conversation for a sales coaching application:\n\nConversation:\n${transcript}\n\nProvide analysis in JSON format with: {"sentiment_score": 0-100, "sentiment": "positive|neutral|negative", "summary": "brief summary", "strengths": [], "improvement_areas": [], "key_phrases": []}`;
  }

  buildCoachingPrompt(transcript, context) {
    return `As a sales coach, analyze this conversation and provide coaching insights:\n\nConversation:\n${transcript}\n\nProvide coaching feedback in JSON format with: {"overall_rating": 0-100, "coaching_tips": [], "best_practices_used": [], "next_steps": [], "role_play_scenarios": []}`;
  }

  parseAnalysisResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        sentiment_score: 50,
        sentiment: 'neutral',
        summary: responseText.substring(0, 200),
        strengths: [],
        improvement_areas: [],
        key_phrases: [],
      };
    } catch (error) {
      logger.warn('Failed to parse analysis response');
      return {
        sentiment_score: 50,
        sentiment: 'neutral',
        summary: responseText,
        strengths: [],
        improvement_areas: [],
        key_phrases: [],
      };
    }
  }

  parseInsightsResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        overall_rating: 50,
        coaching_tips: [],
        best_practices_used: [],
        next_steps: [],
        role_play_scenarios: [],
      };
    } catch (error) {
      logger.warn('Failed to parse insights response');
      return {
        overall_rating: 50,
        coaching_tips: [responseText.substring(0, 200)],
        best_practices_used: [],
        next_steps: [],
        role_play_scenarios: [],
      };
    }
  }
}

module.exports = new ClaudeService();