[한국어](README.md) | **English**

# StudyBuddy 🎓✨
<div align="center">
  <img src="client/src/assets/logoHome.png" width="250"/><br>
  <p><strong>StudyBuddy is a web application designed to help students efficiently form and manage study groups.
</strong></p>
</div>

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
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

### Backend & Database
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)

### Development Tools
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

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
