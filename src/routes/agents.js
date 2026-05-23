const express = require('express');
const { authMiddleware, companyValidationMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const agentService = require('../services/agent');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(companyValidationMiddleware);

/**
 * Create a new agent
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, type, prompt, voiceId, llmModel, metadata, retellConfig } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent name is required',
      });
    }

    logger.info({ userId: req.user.userId, agentName: name }, 'Creating new agent');

    const agent = await agentService.createAgent(
      {
        name,
        type: type || 'coaching',
        prompt,
        voiceId,
        llmModel,
        metadata,
        retellConfig,
      },
      req.user.company_id
    );

    res.status(201).json({
      success: true,
      data: agent,
    });
  })
);

/**
 * Get all agents
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    logger.info({ userId: req.user.userId }, 'Fetching agents');

    const agents = await agentService.getAgentsByCompany(req.user.company_id);

    res.status(200).json({
      success: true,
      data: agents,
    });
  })
);

/**
 * Get agent details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const agent = await agentService.getAgent(id, req.user.company_id);

    res.status(200).json({
      success: true,
      data: agent,
    });
  })
);

/**
 * Update an agent
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await agentService.updateAgent(id, updateData, req.user.company_id);

    res.status(200).json({
      success: true,
      data: updated,
    });
  })
);

/**
 * Delete an agent
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await agentService.deleteAgent(id, req.user.company_id);

    res.status(200).json({
      success: true,
      data: { message: 'Agent deleted successfully' },
    });
  })
);

/**
 * Start a conversation
 */
router.post(
  '/:id/conversations',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { metadata } = req.body;

    const conversation = await agentService.startConversation(id, req.user.company_id, {
      metadata,
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  })
);

module.exports = router;