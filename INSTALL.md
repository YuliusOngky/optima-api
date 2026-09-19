# Phase 3 — NestJS Auth Dependencies

Jalankan di folder `optima-api`:

```bash
npm install @nestjs/passport passport passport-jwt @nestjs/config
npm install --save-dev @types/passport-jwt
```

Tambahkan `SUPABASE_JWT_SECRET` ke `.env`:
- Buka Supabase Dashboard → Project Settings → API
- Salin nilai **JWT Secret**
- Paste ke `.env`:
  ```
  SUPABASE_JWT_SECRET=your-secret-here
  ```

Setelah itu restart server: `npm run start:dev`
