## Render Deployment

This project is prepared for Render with:

- `smartbuy` as the static frontend
- `smartbuy-api` as the Node backend
- Cloudinary-backed image uploads for free hosting

### Required environment variables

Backend:

- `MONGO_URI`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

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
- Set `CLOUDINARY_FOLDER=smartbuy` unless you want a different Cloudinary folder.
- If Cloudinary env vars are missing, uploads fall back to local storage for local development only.
- The frontend uses a rewrite from `/*` to `/index.html` for React Router.
