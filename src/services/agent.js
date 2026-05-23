const { v4: uuidv4 } = require('uuid');
const base44Service = require('./base44');
const retellService = require('./retell');
const logger = require('../utils/logger');

/**
 * Agent Service - Business logic for agent management
 */
class AgentService {
  /**
   * Create a new coaching agent
   * @param {Object} agentData - Agent configuration
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Created agent
   */
  async createAgent(agentData, companyId) {
    try {
      logger.info(
        { agentName: agentData.name, companyId },
        'Creating new coaching agent'
      );

      // Validate required fields
      if (!agentData.name) {
        throw new Error('Agent name is required');
      }

      if (!agentData.type) {
        agentData.type = 'coaching'; // default type
      }

      // Create agent in Retell first
      const retellAgent = await retellService.createAgent({
        name: agentData.name,
        type: agentData.type,
        prompt: agentData.prompt || this.getDefaultPrompt(agentData.type),
        voiceId: agentData.voiceId,
        llmModel: agentData.llmModel,
        additionalConfig: agentData.retellConfig || {},
      });

      if (!retellAgent?.agent_id) {
        throw new Error('Failed to create agent in Retell');
      }

      // Store agent metadata in Base44
      const agentRecord = await base44Service.create('Agent', {
        name: agentData.name,
        type: agentData.type,
        company_id: companyId,
        retell_agent_id: retellAgent.agent_id,
        status: 'active',
        config: {
          prompt: agentData.prompt || this.getDefaultPrompt(agentData.type),
          voiceId: agentData.voiceId,
          llmModel: agentData.llmModel,
        },
        metadata: agentData.metadata || {},
      });

      logger.info(
        { agentId: agentRecord.id, retellAgentId: retellAgent.agent_id },
        'Agent created successfully'
      );

      return agentRecord;
    } catch (error) {
      logger.error(
        { agentName: agentData.name, error: error.message },
        'Failed to create agent'
      );
      throw error;
    }
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent ID
   * @param {string} companyId - Company ID (for verification)
   * @returns {Promise<Object>} Agent details
   */
  async getAgent(agentId, companyId) {
    try {
      const agent = await base44Service.getById('Agent', agentId);

      if (!agent) {
        throw new Error('Agent not found');
      }

      if (agent.company_id !== companyId) {
        throw new Error('Unauthorized: Agent does not belong to your company');
      }

      logger.debug({ agentId }, 'Agent retrieved');

      return agent;
    } catch (error) {
      logger.error({ agentId, error: error.message }, 'Failed to get agent');
      throw error;
    }
  }

  /**
   * Get all agents for a company
   * @param {string} companyId - Company ID
   * @returns {Promise<Array>} Array of agents
   */
  async getAgentsByCompany(companyId) {
    try {
      logger.debug({ companyId }, 'Fetching agents for company');

      const agents = await base44Service.query('Agent', 'company_id', companyId);

      logger.info(
        { companyId, count: agents.length },
        'Agents retrieved'
      );

      return agents;
    } catch (error) {
      logger.error(
        { companyId, error: error.message },
        'Failed to get agents'
      );
      throw error;
    }
  }

  /**
   * Update an agent
   * @param {string} agentId - Agent ID
   * @param {Object} updateData - Data to update
   * @param {string} companyId - Company ID (for verification)
   * @returns {Promise<Object>} Updated agent
   */
  async updateAgent(agentId, updateData, companyId) {
    try {
      const agent = await this.getAgent(agentId, companyId);

      // If name or config changed, update in Retell
      if (updateData.name || updateData.config) {
        const retellUpdate = {};

        if (updateData.name) {
          retellUpdate.agent_name = updateData.name;
        }

        if (updateData.config?.prompt) {
          retellUpdate.prompt = updateData.config.prompt;
        }

        if (Object.keys(retellUpdate).length > 0) {
          await retellService.updateAgent(
            agent.retell_agent_id,
            retellUpdate
          );
        }
      }

      // Update in Base44
      const updated = await base44Service.update('Agent', agentId, updateData);

      logger.info({ agentId }, 'Agent updated successfully');

      return updated;
    } catch (error) {
      logger.error(
        { agentId, error: error.message },
        'Failed to update agent'
      );
      throw error;
    }
  }

  /**
   * Delete an agent
   * @param {string} agentId - Agent ID
   * @param {string} companyId - Company ID (for verification)
   * @returns {Promise<boolean>} Success status
   */
  async deleteAgent(agentId, companyId) {
    try {
      const agent = await this.getAgent(agentId, companyId);

      // Delete from Retell
      await retellService.deleteAgent(agent.retell_agent_id);

      // Delete from Base44
      await base44Service.delete('Agent', agentId);

      logger.info({ agentId }, 'Agent deleted successfully');

      return true;
    } catch (error) {
      logger.error(
        { agentId, error: error.message },
        'Failed to delete agent'
      );
      throw error;
    }
  }

  /**
   * Get default prompt for agent type
   * @private
   */
  getDefaultPrompt(agentType) {
    const prompts = {
      coaching: `You are a professional sales coach. Help the user improve their sales skills through constructive feedback and practical tips. Ask clarifying questions to understand their situation better.`,
      skills: `You are a sales skills trainer. Help the user develop specific sales techniques and best practices. Provide examples and role-play scenarios when appropriate.`,
      knowledge: `You are a knowledgeable sales assistant. Help the user find information about products, services, and sales strategies. Be clear and concise in your explanations.`,
    };

    return prompts[agentType] || prompts.coaching;
  }

  /**
   * Start a conversation with an agent
   * @param {string} agentId - Agent ID
   * @param {string} companyId - Company ID
   * @param {Object} conversationConfig - Conversation configuration
   * @returns {Promise<Object>} Conversation details
   */
  async startConversation(agentId, companyId, conversationConfig = {}) {
    try {
      const agent = await this.getAgent(agentId, companyId);

      const conversationId = uuidv4();

      // Create conversation record
      const conversation = await base44Service.create('Conversation', {
        agent_id: agentId,
        company_id: companyId,
        conversation_id: conversationId,
        status: 'active',
        start_time: new Date().toISOString(),
        transcript: [],
        metadata: conversationConfig.metadata || {},
      });

      logger.info(
        { agentId, conversationId },
        'Conversation started'
      );

      return conversation;
    } catch (error) {
      logger.error(
        { agentId, error: error.message },
        'Failed to start conversation'
      );
      throw error;
    }
  }

  /**
   * Update conversation with transcript
   * @param {string} conversationId - Conversation ID
   * @param {Array} transcript - Conversation messages
   * @returns {Promise<Object>} Updated conversation
   */
  async updateConversationTranscript(conversationId, transcript) {
    try {
      const updated = await base44Service.update(
        'Conversation',
        conversationId,
        {
          transcript,
          updated_at: new Date().toISOString(),
        }
      );

      return updated;
    } catch (error) {
      logger.error(
        { conversationId, error: error.message },
        'Failed to update conversation transcript'
      );
      throw error;
    }
  }

  /**
   * End a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} endData - End data (sentiment, insights, etc.)
   * @returns {Promise<Object>} Ended conversation
   */
  async endConversation(conversationId, endData = {}) {
    try {
      const updated = await base44Service.update(
        'Conversation',
        conversationId,
        {
          status: 'ended',
          end_time: new Date().toISOString(),
          sentiment: endData.sentiment,
          insights: endData.insights || null,
          metrics: endData.metrics || null,
          updated_at: new Date().toISOString(),
        }
      );

      logger.info({ conversationId }, 'Conversation ended');

      return updated;
    } catch (error) {
      logger.error(
        { conversationId, error: error.message },
        'Failed to end conversation'
      );
      throw error;
    }
  }
}

module.exports = new AgentService();
