import { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/test')
      .then(res => setMessage(res.data))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  return (
    <div>
      <h2>Home Page</h2>
      <p>Server Response: {message || 'Loading...'}</p>
    </div>
  );
}

export default Home;
