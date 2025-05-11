import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  validateToken(token: string): boolean {
    // Тут можна парсити JWT або перевіряти свій токен
    return token === 'dev-secret'; // ⚠️ приклад, не для продакшну
  }
}
