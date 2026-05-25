# AWS Readiness Notes

Phase 14 does not implement AWS deployment. These notes identify frontend-facing integration points that should remain clean for future AWS or non-AWS backend infrastructure.

## Frontend-Facing Readiness

- API base URL is configurable through `VITE_API_BASE_URL`.
- API mode is configurable through `VITE_API_MODE`.
- Auth requests use a standard bearer token header.
- Error responses are documented with `{ message, code }`.
- Health checks use `GET /health`.
- File uploads stay behind backend APIs.
- Streaming stays behind backend APIs.
- CORS requirements are explicit.
- Browser-visible `VITE_*` variables do not contain secrets.

## Possible Future AWS Mapping

| Concern | Possible AWS Service | Phase 14 Action |
|---------|----------------------|-----------------|
| Frontend hosting | S3 + CloudFront | No implementation. Keep SPA build portable. |
| API entry | API Gateway or ALB | No implementation. Keep base URL configurable. |
| Backend compute | Lambda or ECS | No implementation. Keep API contract clear. |
| File storage | S3 | No implementation. Keep upload metadata contract backend-owned. |
| Auth | Cognito or custom auth | No implementation. Keep bearer header boundary. |
| Data | RDS or DynamoDB | No implementation. Do not model production schema in frontend repo. |
| Logs/metrics | CloudWatch | No implementation. Keep analytics/support payloads privacy-safe. |
| Payments | Stripe plus backend webhooks | No implementation. Frontend uses hosted checkout only. |

## CORS Notes

Future backend must allow the frontend origins used by local, staging, and production deployments. Local demo backend currently allows:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:4173`
- `http://127.0.0.1:4173`

## Security Notes

- Do not put AWS keys, Stripe secrets, AI provider keys, or database credentials in `VITE_*` variables.
- Do not let the frontend call model providers directly.
- Treat frontend route guards as UX only; backend authorization must enforce data access.
- Keep uploads, streaming, billing, analytics, and admin operations backend-owned.

