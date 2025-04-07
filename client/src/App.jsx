import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="container">
      <h1>StudyBuddy App</h1>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/group" element={<div>Group Page</div>} />
        <Route path="/schedule" element={<div>Schedule Page</div>} />
        <Route path="/chat" element={<div>Chat Page</div>} />
        <Route path="/profile" element={<div>Profile Page</div>} />
      </Routes>
    </div>
  );
}

export default App;