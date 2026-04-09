declare global {
  namespace Express {
    interface Request {
      matrixUser?: string;
    }
  }
}

export {};
