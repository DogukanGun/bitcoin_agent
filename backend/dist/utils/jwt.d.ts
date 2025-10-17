import { JWTPayload } from '@/types';
export declare function generateToken(userId: string, address: string): string;
export declare function verifyToken(token: string): JWTPayload | null;
export declare function decodeToken(token: string): JWTPayload | null;
//# sourceMappingURL=jwt.d.ts.map