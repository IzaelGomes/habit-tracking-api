import { Injectable } from '@nestjs/common';

@Injectable()
export class LogoutService {
  execute() {
    return {
      message: 'Logout successful. Please remove the token from the client.',
    };
  }
}

