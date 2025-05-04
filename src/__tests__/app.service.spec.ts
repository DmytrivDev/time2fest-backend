import { AppService } from '../app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService(); // створюємо новий інстанс перед кожним тестом
  });

  it('should return greeting', () => {
    expect(service.getHello()).toBe('Hello from Time2Fest backend 👋');
  });
});