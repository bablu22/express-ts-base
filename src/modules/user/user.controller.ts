import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { UserService } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId as string;
    const user = await this.userService.getUserProfile(userId);
    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  };
}
