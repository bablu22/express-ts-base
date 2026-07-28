import { BaseService } from '@shared/base.service';
import { NotFoundError } from '@utils/errors';
import type { IUserRepository, UserRecord } from './user.repository.interface';

export class UserService extends BaseService {
  constructor(private readonly userRepository: IUserRepository) {
    super();
  }

  async getUserProfile(id: string): Promise<Omit<UserRecord, 'password'>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const { password: _password, ...profile } = user;
    return profile;
  }
}
