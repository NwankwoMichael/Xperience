import * as express from "express";
import { IUser } from "./models/userModel";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    requestTime?: string; // Use ? cos requestTime only exists after middleware is called
  }
}
