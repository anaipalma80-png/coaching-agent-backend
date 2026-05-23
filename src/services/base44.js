const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getConfig } = require('../config/env');
const logger = require('../utils/logger');

const config = getConfig();

/**
 * Base44 Service - No-code database integration
 */
class Base44Service {
  constructor() {
    this.client = axios.create({
      baseURL: config.base44.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-App-ID': config.base44.appId,
      },
      timeout: 10000,
    });
  }

  /**
   * Create a new record in Base44
   */
  async create(entity, data) {
    try {
      const recordId = uuidv4();
      const payload = {
        id: recordId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      logger.debug({ entity, recordId }, `Creating record in Base44`);

      const response = await this.client.post(`/${entity}`, payload);

      logger.info({ entity, recordId }, `Record created successfully in Base44`);

      return response.data;
    } catch (error) {
      logger.error(
        {
          entity,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to create record in Base44'
      );
      throw new Error(`Failed to create ${entity} in Base44: ${error.message}`);
    }
  }

  /**
   * Get a record by ID
   */
  async getById(entity, id) {
    try {
      logger.debug({ entity, id }, `Fetching record from Base44`);

      const response = await this.client.get(`/${entity}/${id}`);

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        logger.debug({ entity, id }, `Record not found in Base44`);
        return null;
      }

      logger.error(
        {
          entity,
          id,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to fetch record from Base44'
      );
      throw new Error(`Failed to fetch ${entity} from Base44: ${error.message}`);
    }
  }

  /**
   * Query records by field value
   */
  async query(entity, field, value) {
    try {
      logger.debug({ entity, field, value }, `Querying records in Base44`);

      const response = await this.client.get(`/${entity}`, {
        params: {
          [field]: value,
        },
      });

      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      logger.error(
        {
          entity,
          field,
          value,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to query records in Base44'
      );
      throw new Error(`Failed to query ${entity} in Base44: ${error.message}`);
    }
  }

  /**
   * Get all records for an entity
   */
  async getAll(entity) {
    try {
      logger.debug({ entity }, `Fetching all records from Base44`);

      const response = await this.client.get(`/${entity}`);

      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      logger.error(
        {
          entity,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to fetch all records from Base44'
      );
      throw new Error(`Failed to fetch ${entity} from Base44: ${error.message}`);
    }
  }

  /**
   * Update a record
   */
  async update(entity, id, data) {
    try {
      const payload = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      logger.debug({ entity, id }, `Updating record in Base44`);

      const response = await this.client.put(`/${entity}/${id}`, payload);

      logger.info({ entity, id }, `Record updated successfully in Base44`);

      return response.data;
    } catch (error) {
      logger.error(
        {
          entity,
          id,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to update record in Base44'
      );
      throw new Error(`Failed to update ${entity} in Base44: ${error.message}`);
    }
  }

  /**
   * Delete a record
   */
  async delete(entity, id) {
    try {
      logger.debug({ entity, id }, `Deleting record from Base44`);

      await this.client.delete(`/${entity}/${id}`);

      logger.info({ entity, id }, `Record deleted successfully from Base44`);

      return true;
    } catch (error) {
      logger.error(
        {
          entity,
          id,
          error: error.message,
          status: error.response?.status,
        },
        'Failed to delete record from Base44'
      );
      throw new Error(`Failed to delete ${entity} from Base44: ${error.message}`);
    }
  }
}

module.exports = new Base44Service();