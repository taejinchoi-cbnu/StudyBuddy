import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDepartment(userProfile.department || '');
      setInterests(userProfile.interests ? userProfile.interests.join(', ') : '');
    }
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Convert comma-separated interests to array
      const interestsArray = interests
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      await updateUserProfile({
        displayName,
        department,
        interests: interestsArray
      });
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Profile</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group id="email" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    value={currentUser?.email || ''} 
                    disabled 
                  />
                  <Form.Text className="text-muted">
                    You cannot change your email address.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group id="displayName" className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group id="department" className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                  />
                </Form.Group>
                
                <Form.Group id="interests" className="mb-3">
                  <Form.Label>Interests (comma separated)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={interests} 
                    onChange={(e) => setInterests(e.target.value)} 
                  />
                  <Form.Text className="text-muted">
                    Example: React, Node.js, Data Science
                  </Form.Text>
                </Form.Group>
                
                <Button disabled={loading} className="w-100 mb-3" type="submit">
                  Update Profile
                </Button>
              </Form>
              
              <div className="w-100 text-center mt-2">
                <Button variant="link" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;