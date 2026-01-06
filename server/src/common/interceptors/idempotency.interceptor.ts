import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// Mock storage for demo (Use Redis in production)
const idempotencyStore = new Map<string, any>();

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.headers['idempotency-key'];

    if (!key) return next.handle(); // No key, proceed normally

    if (idempotencyStore.has(key)) {
      const cached = idempotencyStore.get(key);
      // If payload is different, throw Conflict (Senior Requirement)
      if (JSON.stringify(request.body) !== JSON.stringify(cached.payload)) {
        throw new ConflictException('Idempotency key reused with different payload');
      }
      return of(cached.response);
    }

    return next.handle().pipe(
      tap((response) => {
        idempotencyStore.set(key, { payload: request.body, response });
      }),
    );
  }
}