const API_BASE_URL = 'http://localhost:3000/api';

class ServerApi {
  static async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    console.log(`Making API request to: ${url}`);
    console.log('Request config:', { ...config, headers: { ...config.headers, Authorization: config.headers.Authorization ? '[TOKEN]' : undefined } });

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log(`API response from ${endpoint}:`, { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  static async authenticatedRequest(endpoint, token, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Auth endpoints
  static async registerUser(token, userData) {
    return this.authenticatedRequest('/auth/register', token, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static async loginUser(token) {
    return this.authenticatedRequest('/auth/login', token, {
      method: 'POST'
    });
  }

  static async getUserProfile(token) {
    return this.authenticatedRequest('/auth/profile', token, {
      method: 'GET'
    });
  }

  static async updateUserProfile(token, profileData) {
    return this.authenticatedRequest('/auth/profile', token, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  static async logoutUser(token) {
    return this.authenticatedRequest('/auth/logout', token, {
      method: 'POST'
    });
  }

  // Email verification endpoints
  static async verifyEmail(email, univName = '충북대학교', univ_check = true) {
    return this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        email,
        univName,
        univ_check
      })
    });
  }

  static async checkEmailStatus(email) {
    return this.makeRequest('/auth/check-status', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Update email certification status
  static async updateEmailCertification(token) {
    return this.authenticatedRequest('/auth/update-email-certification', token, {
      method: 'POST'
    });
  }
}

export default ServerApi;