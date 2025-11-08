import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async signup(email: string, handle: string, password: string) {
    // UNIMPLEMENTED: Business logic agent will implement user creation
    throw new Error('UNIMPLEMENTED: signup');
  }

  async login(email: string, password: string) {
    // UNIMPLEMENTED: Business logic agent will implement authentication
    throw new Error('UNIMPLEMENTED: login');
  }

  async logout(userId: string) {
    // UNIMPLEMENTED: Business logic agent will implement session invalidation
    throw new Error('UNIMPLEMENTED: logout');
  }

  async validateUser(email: string, password: string) {
    // UNIMPLEMENTED: Business logic agent will implement user validation
    throw new Error('UNIMPLEMENTED: validateUser');
  }
}
