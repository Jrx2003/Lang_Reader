# Lang Reader Application

A complete language learning application for video segment looping and note-taking.

## Features

- Create and manage language learning projects
- Import YouTube videos or direct video links
- Set breakpoints at specific timestamps for study
- Loop video segments between breakpoints with customizable repetition
- Add notes to breakpoints and projects
- Responsive design for both desktop and mobile

## Project Structure

This project consists of two main parts:

1. **Frontend** - Vue 3 + Vite application in the `lang-reader` directory
2. **Backend** - Express.js + MongoDB API in the `backend` directory

## Quick Start

The easiest way to run the entire application is to use the provided start script:

```bash
node start.js
```

This will:
1. Check for and install dependencies in both frontend and backend
2. Start the backend server on port 3000
3. Start the frontend dev server on port 5173

Then open your browser to http://localhost:5173

## Manual Setup

If you prefer to run the frontend and backend separately:

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on http://localhost:3000

### Frontend Setup

```bash
cd lang-reader
npm install
npm run dev
```

The frontend will run on http://localhost:5173

## Tech Stack

### Frontend
- Vue 3 with Composition API
- Vue Router for navigation
- Pinia for state management
- Axios for API requests

### Backend
- Express.js for the API server
- MongoDB for data storage
- Mongoose for database modeling

## Environment Variables

The backend uses the following environment variables in a `.env` file:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lang-reader
```

A local MongoDB installation is required to run the application. Make sure MongoDB is running on the standard port 27017.

## License

MIT 