import User from "../../lib/db/entities/User";
import { NextFunction, Request, Response } from "express";

export interface VerifiedRequest extends Request {
  verifiedUser?: User;
}
export default async function verifyUser(req: VerifiedRequest, res: Response, next: NextFunction) {
  const user = req.user;
  const id: string = user.id;
  if (!user || user.type !== "user" || !id) return res.status(401);
  const dbUser = await User.findOneBy({ id });
  if (!dbUser) return res.status(404);
  req.verifiedUser = dbUser;
  next();
}
