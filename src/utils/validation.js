import Joi from "joi";

// Helper function to create complete validation schemas
export const createCompleteSchema = (schemaObject) => {
  const schema = {
    body: schemaObject.body || Joi.object({}).unknown(false),
    params: schemaObject.params || Joi.object({}).unknown(false),
    query: schemaObject.query || Joi.object({}).unknown(false),
    headers: schemaObject.headers || Joi.object({}).unknown(true),
  };

  if (schemaObject.file) {
    schema.file = schemaObject.file;
  }

  if (schemaObject.files) {
    schema.files = schemaObject.files;
  }

  return schema;
};
