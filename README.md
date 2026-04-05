# SmartBuy

MERN ecommerce project prepared for GitHub and Render.

## Project Structure

- `client/`: Vite + React frontend
- `server/`: Express + MongoDB backend
- `render.yaml`: Render blueprint for `smartbuy` and `smartbuy-api`

## Local Setup

### Backend

1. `cd server`
2. Create `server/.env`
3. Install dependencies with `npm install`
4. Start with `npm run dev`

### Frontend

1. `cd client`
2. Install dependencies with `npm install`
3. Start with `npm run dev`

## GitHub Push

After creating an empty GitHub repository:

```bash
git remote add origin <your-github-repo-url>
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Render

Connect the GitHub repository in Render and use the root `render.yaml`.
See `RENDER_DEPLOY.md` for required environment variables.
