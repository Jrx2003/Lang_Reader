# Lang Reader

Lang Reader is a Vue 3 + Vite based language learning tool, focused on video segment loop learning and note management.

## Features

- Project Management: Create, edit, and delete learning projects
- Video Looping: Set breakpoints to loop specific video segments
- Breakpoint Management: Add breakpoints at any position in the video, with notes
- Loop Control: Set loop count, wait time, support multiple loop modes
- YouTube Support: Seamless integration with YouTube videos
- Notes Feature: Add study notes to each project
- Responsive Design: Compatible with mobile and desktop devices

## Tech Stack

- Vue 3 Composition API
- Vite build tool
- Vue Router for navigation
- Pinia state management
- Axios for HTTP requests

## Local Development

### Prerequisites

- Node.js v14 or higher
- npm or yarn

### Installation and Running

1. Clone the project or extract project files

2. Enter the project directory
```bash
cd project3/lang-reader
```

3. Install dependencies
```bash
npm install
# or
yarn install
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Visit `http://localhost:5173` in your browser

### Building for Production

```bash
npm run build
# or
yarn build
```

## Backend API

The project is configured to connect to a local backend API (`http://localhost:3000/api`), API endpoints include:

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Project Structure

```
lang-reader/
©À©¤©¤ public/               # Static assets
©À©¤©¤ src/                  # Source code
©¦   ©À©¤©¤ assets/           # Project asset files
©¦   ©¦   ©À©¤©¤ BreakpointList.vue   # Breakpoint list component
©¦   ©¦   ©À©¤©¤ ProjectForm.vue      # Project form component
©¦   ©¦   ©À©¤©¤ ProjectList.vue      # Project list component
©¦   ©¦   ©¸©¤©¤ VideoEditor.vue      # Video editor component
©¦   ©À©¤©¤ services/         # Services
©¦   ©¦   ©¸©¤©¤ api.js        # API service
©¦   ©À©¤©¤ store/            # State management
©¦   ©¦   ©¸©¤©¤ projects.js   # Projects state
©¦   ©À©¤©¤ views/            # View components
©¦   ©¦   ©À©¤©¤ ProjectsView.vue     # Projects list page
©¦   ©¦   ©À©¤©¤ ProjectNewView.vue   # New project page
©¦   ©¦   ©¸©¤©¤ ProjectEditView.vue  # Project edit page
©¦   ©À©¤©¤ App.vue           # Root component
©¦   ©À©¤©¤ main.js           # Entry file
©¦   ©¸©¤©¤ router.js         # Router configuration
©À©¤©¤ index.html            # HTML template
©À©¤©¤ vite.config.js        # Vite configuration
©¸©¤©¤ package.json          # Dependencies configuration
```

## Core Features Explanation

### Breakpoint Loop Logic

The VideoEditor component implements advanced breakpoint looping functionality:

1. Users can add breakpoints at any timestamp, with data including time and notes
2. Breakpoints are visually displayed on the timeline, with click-selection support
3. In loop mode, the video strictly plays between two selected breakpoints for a specified number of times
4. After each loop ends, it pauses for a specified time before continuing the next loop
5. Supports both HTML5 video and YouTube video looping

### API Save Process

Project data saving process:

1. When projects are created/updated, state is managed through the Pinia store
2. All state changes (adding breakpoints, updating notes, etc.) trigger store actions
3. Actions call corresponding methods in api.js to send requests to the backend
4. After successful backend response, frontend state is updated, ensuring consistency between frontend and backend

## Contribution and Support

For issues or suggestions, please submit an issue or pull request. 