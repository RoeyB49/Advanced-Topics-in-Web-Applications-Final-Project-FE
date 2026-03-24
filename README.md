# Animon Frontend

Frontend for our anime social/review platform built with React, TypeScript, and Vite.

## What We Built

- Authentication flow (register, login, logout)
- Social login support (Google and Facebook)
- Protected routes for authenticated pages
- Feed with infinite scroll for anime reviews
- Intelligent search with AI query analysis
- Create and edit review posts (with image upload)
- Post comments and discussions
- Personal profile page with profile editing and user posts
- AI Anime Advisor chat for personalized recommendations

## Tech Stack

- React 19 + TypeScript
- Vite
- Ant Design
- React Router
- Axios

## Quick Start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables (Optional)

Create a `.env` file if needed:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
```

## Notes

- This repo is the FE only and expects a compatible backend API.
