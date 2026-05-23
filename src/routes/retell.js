const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const base44Service = require('../services/base44');
const retellService = require('../services/retell');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Handle Retell webhook events
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const { event, call_id, call_data, transcript, metadata } = req.body;

    logger.info({ event, callId: call_id }, 'Received Retell webhook');

    if (!call_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing call_id',
      });
    }

    try {
      switch (event) {
        case 'call.started': {
          logger.info({ callId: call_id }, 'Call started');
          return res.status(200).json({
            success: true,
            data: { message: 'Call started event processed' },
          });
        }

        case 'call.ended': {
          logger.info({ callId: call_id }, 'Call ended');
          return res.status(200).json({
            success: true,
            data: { message: 'Call ended event processed' },
          });
        }

        case 'call.transcript': {
          logger.info({ callId: call_id }, 'Transcript received');
          return res.status(200).json({
            success: true,
            data: { message: 'Transcript event processed' },
          });
        }

        case 'call.error': {
          logger.error({ callId: call_id }, 'Call error');
          return res.status(200).json({
            success: true,
            data: { message: 'Call error event processed' },
          });
        }

        default: {
          logger.warn({ event }, 'Unknown event');
          return res.status(200).json({
            success: true,
            data: { message: 'Event received' },
          });
        }
      }
    } catch (error) {
      logger.error({ event, callId: call_id, error: error.message }, 'Webhook processing error');
      return res.status(200).json({
        success: false,
        error: 'Webhook processed with errors',
      });
    }
  })
);

module.exports = router;