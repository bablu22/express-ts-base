import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthService } from './auth.service';
import type { LoginDto, RegisterDto, ResendOtpDto, VerifyOtpDto } from './auth.schema';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as RegisterDto;
    const result = await this.authService.register(dto);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: result.message,
    });
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as VerifyOtpDto;
    const result = await this.authService.verifyOtp(dto);
    res.status(StatusCodes.OK).json({
      success: true,
      data: { accessToken: result.accessToken },
      message: result.message,
    });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as LoginDto;
    const result = await this.authService.login(dto);
    res.status(StatusCodes.OK).json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as ResendOtpDto;
    const result = await this.authService.resendOtp(dto);
    res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  };
}
