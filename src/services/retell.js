const axios = require('axios');
const { getConfig } = require('../config/env');
const logger = require('../utils/logger');

const config = getConfig();

/**
 * Retell AI Service - Voice and agent management
 */
class RetellService {
  constructor() {
    this.client = axios.create({
      baseURL: config.retell.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.retell.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Create a new agent in Retell
   */
  async createAgent(agentConfig) {
    try {
      const payload = {
        agent_name: agentConfig.name,
        agent_type: agentConfig.type || 'coaching',
        llm_model: agentConfig.llmModel || 'gpt-4',
        voice_id: agentConfig.voiceId || 'default',
        prompt: agentConfig.prompt || '',
        tools: agentConfig.tools || [],
        ...agentConfig.additionalConfig,
      };

      logger.debug({ agentName: agentConfig.name }, 'Creating agent in Retell');

      const response = await this.client.post('/agent', payload);

      logger.info(
        { agentId: response.data.agent_id, agentName: agentConfig.name },
        'Agent created successfully in Retell'
      );

      return response.data;
    } catch (error) {
      logger.error(
        {
          agentName: agentConfig.name,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to create agent in Retell'
      );
      throw new Error(`Failed to create agent in Retell: ${error.message}`);
    }
  }

  /**
   * Get agent details from Retell
   */
  async getAgent(agentId) {
    try {
      logger.debug({ agentId }, 'Fetching agent from Retell');

      const response = await this.client.get(`/agent/${agentId}`);

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        logger.debug({ agentId }, 'Agent not found in Retell');
        return null;
      }

      logger.error(
        {
          agentId,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to fetch agent from Retell'
      );
      throw new Error(`Failed to fetch agent from Retell: ${error.message}`);
    }
  }

  /**
   * Update an agent in Retell
   */
  async updateAgent(agentId, updateData) {
    try {
      logger.debug({ agentId }, 'Updating agent in Retell');

      const response = await this.client.patch(`/agent/${agentId}`, updateData);

      logger.info({ agentId }, 'Agent updated successfully in Retell');

      return response.data;
    } catch (error) {
      logger.error(
        {
          agentId,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to update agent in Retell'
      );
      throw new Error(`Failed to update agent in Retell: ${error.message}`);
    }
  }

  /**
   * Delete an agent from Retell
   */
  async deleteAgent(agentId) {
    try {
      logger.debug({ agentId }, 'Deleting agent from Retell');

      await this.client.delete(`/agent/${agentId}`);

      logger.info({ agentId }, 'Agent deleted successfully from Retell');

      return true;
    } catch (error) {
      logger.error(
        {
          agentId,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to delete agent from Retell'
      );
      throw new Error(`Failed to delete agent from Retell: ${error.message}`);
    }
  }

  /**
   * Register webhook for call events
   */
  async registerWebhook(webhookUrl, events) {
    try {
      const payload = {
        url: webhookUrl,
        events: events || ['call.started', 'call.ended', 'call.transcript'],
      };

      logger.debug({ webhookUrl }, 'Registering webhook with Retell');

      const response = await this.client.post('/webhook', payload);

      logger.info({ webhookUrl }, 'Webhook registered successfully with Retell');

      return response.data;
    } catch (error) {
      logger.error(
        {
          webhookUrl,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to register webhook with Retell'
      );
      throw new Error(`Failed to register webhook with Retell: ${error.message}`);
    }
  }
}

module.exports = new RetellService();