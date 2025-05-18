<img width="677" alt="image" src="https://github.com/user-attachments/assets/f7ee32f2-1ae3-47ce-9dce-5329dec6bb5e" />

[한국어](README.md) | **English**

# StudyBuddy 🎓✨

![Web Icon](client/src/assets/logoHome.png)

StudyBuddy is an application that helps students easily create and join study groups, and coordinate their schedules. 📚
It can be used not only for study groups but also for forming teams for competitions, graduation projects, and any other activities that require group collaboration! 🤝

## 0. Motivation for the Project 💡

Finding suitable teammates for academic and project work is always challenging. While working on competitions, algorithm studies, hackathons, and personal projects, we experienced the following issues:

1. **Difficulty finding suitable teammates**: 🔍 Hard to find team members with specific skills or positions within personal networks
2. **Geographical limitations**: 🗺️ Existing platforms allow matching regardless of location, but this creates inconvenience for offline collaboration
3. **Lack of credibility**: 🤔 On anonymous platforms like Everytime, it's difficult to verify the skills of potential team members
4. **Complex schedule coordination**: ⏰ Inefficient process of individually asking each person about their available times

To solve these problems, we developed a new team matching platform that addresses the shortcomings of existing services while enhancing their advantages.

## 1. Your Idea 💭

- Reliable online community
    - **University email verification**: ✅ Sign up only available with Chungbuk National University email (@chungbuk.ac.kr)
- Flexible team matching system
    - **Bidirectional matching**: 🔄 Create teams to recruit members or register individual profiles to receive offers
- Efficient schedule management
    - **Available time input**: 📝 Interface for each member to input their available times
    - **Optimal time automatic calculation**: 🧮 Automatically derive common available times for all members
    - **Visual calendar**: 📅 Visualize group schedules in calendar format
- Project progress management
    - **Progress visualization**: 📊 Provide Gantt charts

## Features ✨

### Currently Implemented Features
- **User Authentication**
  - 📝 Registration (email/password)
  - 🔑 Login/Logout
- **User Profile Management**
  - 👤 Basic information settings (name, department, interests)
  - 📋 Display and edit user information
- **UI/UX**
  - 📱 Responsive design (mobile, tablet, desktop)
  - 🖼️ Modal authentication forms
  - 🇰🇷 Korean font application and consistent design
  - 🌓 Dark mode support
  - 🔄 Unified loading interface (useLoading hook applied)

- **Group Creation** 👥
- **Group Search Page** 🔍
- **Group Join Requests** 📨
- **Group Admin Functions** 👑
  - Request approval/rejection
  - Group deletion

- **Schedule Adjustment** ⏰
  - Input unavailable times for each member
  - Automatic calculation of times when all members can participate
  - Admin view of time submission status
  - Permission management for group members only

### Features in Development
- **Calendar Integration**: 📅 Sync with Google Calendar for more efficient study schedule management
- **Dashboard**: 📊 Display meeting times in Gantt charts on the user's home screen, along with clocks, participating groups, etc.

## Tech Stack 🛠️

- **Frontend**: Vite + React, HTML+CSS, Bootstrap, React Router
- **Backend**: Node.js, Express, Axios
- **Database**: Firebase (Authentication, Firestore)
- **Others**: Git, GitHub

## Installation and Setup 🚀

1. Clone the repository.
```bash
git clone https://github.com/taejinchoi-cbnu/StudyBuddy.git
cd StudyBuddy
```
2. Set up environment variables.

**Client Side**
```bash
cd client
cp .env.example .env
```
Enter your Firebase configuration information in the `.env` file:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Server Side**
```bash
cd ../server
cp .env.example .env
```

3. Install dependencies.
**Client Side**
```bash
cd client
npm install
```
**Server Side**
```bash
cd ../server
npm install
```

4. Run the application.

**Client Side (in a new terminal)**
```bash
cd client
npm run dev
```

**Server Side (in a new terminal)**
```bash
cd server
npm run dev
```

5. Access http://localhost:5173 in your browser.

## Key Feature Details 🔑

### 1. Custom Hook UseLoading
A custom hook for consistently managing the loading state of asynchronous operations.
```jsx
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
Support for dark mode throughout the application using DarkModeContext.
```jsx
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 3. Schedule Adjustment Feature
A feature that efficiently finds available times for group members.
```jsx
// client\src\components\schedule\UnavailabilitySelector.jsx

// Add unavailable time
const addUnavailableTime = (userId, day, startTime, endTime) => {
  // Time addition logic
};

// Calculate times available for everyone
const calculateAvailableTimes = () => {
  // Time calculation algorithm
};
```

## How to Contribute 🤝
1. Fork this repository.
2. Create a new branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the remote branch: `git push origin feature/my-feature`
5. Create a Pull Request.

## License 📜
This project is distributed under the MIT license.