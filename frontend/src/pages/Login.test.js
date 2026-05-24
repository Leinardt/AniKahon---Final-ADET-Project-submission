import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../context/AuthContext';
import { loginUser as loginAPI } from '../api';

// Mock the AuthContext hooks
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API calls
jest.mock('../api', () => ({
  loginUser: jest.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Frontend Login Page - React Testing Suite', () => {
  let mockLoginUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoginUser = jest.fn();
    useAuth.mockReturnValue({
      user: null,
      loginUser: mockLoginUser,
    });
  });

  test('Test Case 5.1: Verify login page form elements render successfully', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Verify page title and heading
    expect(screen.getByText('Login to AniKahon')).toBeInTheDocument();
    expect(screen.getByText('Enter your details below')).toBeInTheDocument();

    // Verify input fields
    expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();

    // Verify buttons
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('Test Case 5.2: Verify invalid credentials display error message', async () => {
    // Mock API to return error on reject
    loginAPI.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid email or password.'
        }
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const loginButton = screen.getByRole('button', { name: /Login/i });

    // Fill out form
    fireEvent.change(emailInput, { target: { value: 'baduser' } });
    fireEvent.change(passwordInput, { target: { value: 'badpass' } });

    // Click submit
    fireEvent.click(loginButton);

    // Wait for mock API to resolve and check for error output
    await waitFor(() => {
      expect(loginAPI).toHaveBeenCalledWith({ email: 'baduser', password: 'badpass' });
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });

    // Ensure navigate was NOT called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
