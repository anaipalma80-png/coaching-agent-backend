const express = require('express');
const { authMiddleware, companyValidationMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const agentService = require('../services/agent');
const base44Service = require('../services/base44');
const logger = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(companyValidationMiddleware);

/**
 * Get conversation details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversation = await base44Service.getById('Conversation', id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    if (conversation.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  })
);

/**
 * Update conversation transcript
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { transcript } = req.body;

    if (!Array.isArray(transcript)) {
      return res.status(400).json({
        success: false,
        error: 'Transcript must be an array',
      });
    }

    const conversation = await base44Service.getById('Conversation', id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    if (conversation.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const updated = await agentService.updateConversationTranscript(id, transcript);

    res.status(200).json({
      success: true,
      data: updated,
    });
  })
);

/**
 * End a conversation
 */
router.post(
  '/:id/end',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { sentiment, insights } = req.body;

    const conversation = await base44Service.getById('Conversation', id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    if (conversation.company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const updated = await agentService.endConversation(id, {
      sentiment,
      insights,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  })
);

module.exports = router;