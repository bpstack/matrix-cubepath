import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

interface ValidateSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidateSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) return res.status(400).json({ error: result.error.flatten().fieldErrors });
      Object.assign(req.params, result.data);
    }
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) return res.status(400).json({ error: result.error.flatten().fieldErrors });
      Object.assign(req.query, result.data);
    }
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) return res.status(400).json({ error: result.error.flatten().fieldErrors });
      req.body = result.data;
    }
    next();
  };
}
