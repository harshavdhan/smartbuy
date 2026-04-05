## Render Deployment

This project is prepared for Render with:

- `smartbuy` as the static frontend
- `smartbuy-api` as the Node backend
- a persistent disk for `server/uploads`

### Required environment variables

Backend:

- `MONGO_URI`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Optional backend email variables:

- `MAIL_SERVICE`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM_EMAIL`

### Important notes

- If Render says `smartbuy` or `smartbuy-api` is unavailable, rename the service and update:
  - `CLIENT_URL` on the API service
  - `VITE_API_BASE_URL` on the frontend service
- The backend is set to `starter` so uploaded files survive restarts and deploys.
- The frontend uses a rewrite from `/*` to `/index.html` for React Router.
