[한국어](README.md) | **English**

# StudyBuddy 🎓✨
![Web Icon](client/src/assets/logoHome.png)

StudyBuddy is a web application designed to help students efficiently form and manage study groups.

## 📝 Project Overview

Open Source Web Software Final Project [25-1]

StudyBuddy is a modern web application built with React and Firebase, designed to enable students to easily create and participate in study groups. It provides an efficient collaborative environment through intuitive UI/UX and real-time data synchronization.

## ✨ Key Features

- **🏠 Dashboard**: Personalized dashboard for quick activity overview
- **👥 Group Management**: Create, join, and manage study groups
- **📅 Schedule Management**: Group scheduling coordination and calendar functionality
- **🔔 Notification System**: Real-time group requests and schedule notifications
- **👤 Profile Management**: Personal profile and settings management
- **🌙 Dark Mode**: Theme switching for user convenience

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React-based user interface
- **Vite** - Fast development environment and build tool
- **CSS3** - Responsive design and styling
- **React Router** - Client-side routing

### Backend & Database
- **Node.js** - Server-side runtime
- **Express.js** - Web application framework
- **Firebase** - Real-time database and authentication

### Development Tools
- **ESLint** - Code quality management
- **Git** - Version control

## 🚀 Installation and Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/StudyBuddy.git
cd StudyBuddy
```

2. **Install dependencies**
```bash
# In root directory
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Environment setup**
```bash
# Create client/.env file
cp client/.env.example client/.env

# Create server/.env file
cp server/.env.example server/.env
```

4. **Firebase configuration**
- Create a Firebase project
- Copy web app configuration from project settings
- Add configuration to `client/src/firebase.js` and `server/config/firebase.js`

5. **Run the application**
```bash
# Start server (in server directory)
npm start

# Start client (in client directory)
npm run dev
```

## 📁 Project Structure

```
StudyBuddy/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS styles
│   └── public/            # Static files
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
└── README.md
```

## 🤝 Contributing

1. Fork this repository
2. Create a new feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📄 License

This project is distributed under the MIT License. See [LICENSE.md](LICENSE.md) for more information.

## 📞 Contact

Feel free to reach out if you have any questions about the project.
(xowls000@chungbuk.ac.kr)