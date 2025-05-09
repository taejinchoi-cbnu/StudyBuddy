[한국어](README.md) | **English**

# StudyBuddy
![Web Icon](client/src/assets/logoHome.png)

StudyBuddy is a web application that allows students to easily create and join study groups, coordinate schedules, and communicate in real-time.
It can be used not only for study groups but also for forming teams for competitions, graduation projects, and any field where group collaboration is needed.

## 0. Project Motivation

Finding suitable team members for academic and project work is always a challenging task. While working on competitions, algorithm studies, hackathons, and personal projects, we experienced the following issues:

1. **Difficulty finding suitable team members**: It's hard to find team members with specific skills or for specific positions through personal networks
2. **Geographical limitations**: Existing platforms allow matching regardless of location, which is advantageous, but can cause difficulties for offline collaboration
3. **Lack of credibility**: Anonymous platforms like Everytime make it difficult to verify the skills and reliability of potential team members

To address these issues, we developed a new team matching platform that improves upon the weaknesses of existing services while enhancing their strengths.

## 1. Your idea

- Reliable online community
    - **University email verification**: Registration only possible with Chungbuk National University email (@chungbuk.ac.kr)
    - Building a reliability index through mutual evaluation after collaboration
- Flexible team matching system
    - **Two-way matching**: Create teams to recruit members or register individual profiles to receive offers
    - **Intelligent recommendation algorithm**: Personalized recommendations based on interests, learning styles, and goals
- Efficient schedule management
    - **Availability input**: Interface for each member to input their available times
    - **Optimal time calculation**: Automatic calculation of common available times for all members
    - **Visual calendar**: Visualizing group schedules in calendar format
- Collaboration tools
    - **Group chat**: Real-time communication within the web platform
        - **Markdown support**: Developer-friendly environment
- Project progress management
    - **Milestone setting**: Setting and managing goals by stage
    - **Progress visualization**: Gantt chart provided
        - Simple memo function for each meeting

## Features

### Currently Implemented Features (Week 1)
- **User Authentication**
  - Registration (email/password)
  - Login/Logout
  - Password reset
- **User Profile Management**
  - Basic information settings (name, department, interests)
  - User information display and editing
- **UI/UX**
  - Responsive design (mobile, tablet, desktop)
  - Modal authentication forms
  - Korean font application and consistent design
  - Dark mode support
  - Unified loading interface (useLoading hook applied)

### Features in Development
- **Study Group Management**: Creation, search, join requests, approval/rejection
- **Schedule Matching**: Finding common available times among members
- **Real-time Group Chat**: Text-based message exchange
- **Schedule Confirmation**: More efficient management of study schedules through Google Calendar integration

## Technology Stack

- **Frontend**: Vite + React, Bootstrap, React Router
- **Backend**: Node.js, Express, Axios
- **Database**: Firebase (Authentication, Firestore)
- **Others**: Git, GitHub

## Installation and Running Instructions

1. Clone the repository.
```bash
git clone https://github.com/taejinchoi-cbnu/StudyBuddy.git
cd StudyBuddy
```

2. Set up environment variables.

   Client side
   ```bash
   cd client
   cp .env.example .env
   ```
   Enter Firebase configuration information in the `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   Server side
   ```bash
   cd ../server
   cp .env.example .env
   ```

3. Install dependencies.

   Client side
   ```bash
   cd client
   npm install
   ```

   Server side
   ```bash
   cd ../server
   npm install
   ```

4. Run the application.

   Client side (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

   Server side (in a new terminal)
   ```bash
   cd server
   npm run dev
   ```

5. Access [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
STUDYBUDDY/
├── client/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── logoHello.png
│   │   │   ├── logoQuestion.png
│   │   │   ├── logoSmall.png
│   │   │   ├── logoBook.png
│   │   │   └── logoTextGif.gif
│   │   ├── components/
│   │   │   ├── AppNavbar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/ 
│   │   │   ├── AuthContext.jsx
│   │   │   └── DarkModeContext.jsx
│   │   ├── hooks/
│   │   │   └── useLoading.js
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── styles/
│   │   │   ├── DashboardStyles.css
│   │   │   ├── LoadingSpinner.css
│   │   │   └── MainStyles.css
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── node_modules/
    ├── routes/
    ├── .env
    ├── package-lock.json
    ├── package.json
    ├── server.js
    ├── .env.example
    ├── .gitignore
    ├── Project Log.md
    └── README.md
```

## Key Features Explanation

### 1. Custom Hook useLoading
A custom hook that consistently manages the loading state of asynchronous operations.

> **Note**: This hook was implemented with reference to [Toss Slash Library's useLoading](https://www.slash.page/ko/libraries/react/use-loading/src/useLoading.i18n).

```javascript
const [isLoading, startLoading] = useLoading();

// Usage example
const handleOperation = async () => {
  try {
    const result = await startLoading(someAsyncOperation());
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### 2. Dark Mode
DarkModeContext supports dark mode throughout the application.

```javascript
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 3. Unified Navigation
The AppNavbar component provides a consistent navigation UI across all pages.

## How to Contribute

1. Fork this repository.
2. Create a new branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the remote branch: `git push origin feature/my-feature`
5. Create a Pull Request.

## License

This project is distributed under the MIT license.
