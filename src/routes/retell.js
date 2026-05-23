const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const agentService = require('../services/agent');
const base44Service = require('../services/base44');
const retellService = require('../services/retell');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Verify Retell webhook signature
 * @private
 */
function verifyRetellSignature(req) {
  // In production, verify the webhook signature from Retell
  // For now, just check if the request has required fields
  if (!req.body.call_id) {
    return false;
  }
  return true;
}

/**
 * Handle Retell webhook events
 * POST /api/retell/webhook
 * Events: call.started, call.ended, call.transcript
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const { event, call_id, call_data, transcript, metadata } = req.body;

    logger.info(
      {
        event,
        callId: call_id,
      },
      'Received Retell webhook'
    );

    // Verify webhook signature
    if (!verifyRetellSignature(req)) {
      logger.warn('Invalid Retell webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    try {
      switch (event) {
        case 'call.started': {
          logger.info({ callId: call_id }, 'Call started');

          // Create call metadata record if needed
          if (metadata?.conversation_id) {
            const conversation = await base44Service.getById(
              'Conversation',
              metadata.conversation_id
            );

            if (conversation) {
              await base44Service.update('Conversation', metadata.conversation_id, {
                retell_call_id: call_id,
                call_start_time: new Date().toISOString(),
              });
            }
          }

          return res.status(200).json({
            success: true,
            data: { message: 'Call started event processed' },
          });
        }

        case 'call.ended': {
          logger.info({ callId: call_id }, 'Call ended');

          // Update conversation with call end data
          if (metadata?.conversation_id) {
            await base44Service.update('Conversation', metadata.conversation_id, {
              call_end_time: new Date().toISOString(),
              call_duration: call_data?.duration || 0,
              call_status: call_data?.status || 'completed',
            });
          }

          return res.status(200).json({
            success: true,
            data: { message: 'Call ended event processed' },
          });
        }

        case 'call.transcript': {
          logger.info(
            { callId: call_id, transcriptLength: transcript?.length || 0 },
            'Transcript received'
          );

          // Update conversation with transcript
          if (metadata?.conversation_id && transcript) {
            // Convert Retell transcript format to our format
            const formattedTranscript = transcript.map((item) => ({
              role: item.role || 'user',
              content: item.content || item.message || '',
              timestamp: item.timestamp,
            }));

            const conversation = await base44Service.update(
              'Conversation',
              metadata.conversation_id,
              {
                transcript: formattedTranscript,
                transcript_updated_at: new Date().toISOString(),
              }
            );

            logger.info(
              { conversationId: metadata.conversation_id },
              'Conversation transcript updated'
            );
          }

          return res.status(200).json({
            success: true,
            data: { message: 'Transcript event processed' },
          });
        }

        case 'call.error': {
          logger.error(
            {
              callId: call_id,
              errorCode: call_data?.error_code,
              errorMessage: call_data?.error_message,
            },
            'Call error received'
          );

          // Update conversation with error status
          if (metadata?.conversation_id) {
            await base44Service.update('Conversation', metadata.conversation_id, {
              status: 'error',
              error_message: call_data?.error_message,
              call_end_time: new Date().toISOString(),
            });
          }

          return res.status(200).json({
            success: true,
            data: { message: 'Call error event processed' },
          });
        }

        default: {
          logger.warn({ event }, 'Unknown Retell event');

          return res.status(200).json({
            success: true,
            data: { message: 'Event received but not processed' },
          });
        }
      }
    } catch (error) {
      logger.error(
        {
          event,
          callId: call_id,
          error: error.message,
        },
        'Failed to process Retell webhook'
      );

      // Still return 200 to acknowledge receipt (prevent retry)
      return res.status(200).json({
        success: false,
        error: 'Webhook processed with errors',
      });
    }
  })
);

/**
 * Get call details
 * GET /api/retell/calls/:callId
 */
router.get(
  '/calls/:callId',
  asyncHandler(async (req, res) => {
    const { callId } = req.params;

    logger.debug({ callId }, 'Fetching call details');

    // Get conversation with this call ID
    const conversations = await base44Service.getAll('Conversation');
    const conversation = conversations.find(
      (conv) => conv.retell_call_id === callId
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Call not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        call_id: callId,
        conversation_id: conversation.id,
        status: conversation.status,
        start_time: conversation.call_start_time,
        end_time: conversation.call_end_time,
        duration: conversation.call_duration,
        transcript_length: conversation.transcript?.length || 0,
      },
    });
  })
);

/**
 * Register webhook with Retell
 * POST /api/retell/webhook-register
 * Body: { webhookUrl }
 */
router.post(
  '/webhook-register',
  asyncHandler(async (req, res) => {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'webhookUrl is required',
      });
    }

    logger.info({ webhookUrl }, 'Registering webhook with Retell');

    try {
      const registrationResult = await retellService.registerWebhook(
        webhookUrl,
        ['call.started', 'call.ended', 'call.transcript', 'call.error']
      );

      return res.status(200).json({
        success: true,
        data: registrationResult,
      });
    } catch (error) {
      logger.error(
        { webhookUrl, error: error.message },
        'Failed to register webhook with Retell'
      );

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

module.exports = router;
