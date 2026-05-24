from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from api.models import User, Cart

# ==============================================================================
# MEMBER: ALCOVINDAS, NYAN JEAN Q.
# ASSIGNED FEATURE: Account Registration & Validation (User Login)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class AlcovindasLoginTests(APITestCase):
    """
    ALCOVINDAS, NYAN JEAN Q. - Test Case 1.2: User Login
    """
    def setUp(self):
        # Set up initial test data for login tests
        self.existing_password = "securepassword123"
        self.user = User.objects.create(
            FirstName="Jane",
            LastName="Smith",
            Username="janesmith",
            Password=make_password(self.existing_password),
            Email="jane@example.com",
            ContactNum="09123456789",
            Address="123 Access St, Manila"
        )
        Cart.objects.create(User=self.user)

    def test_user_login(self):
        """Test Case 1.2: Verify login with valid credentials (username or email) and failure with invalid ones."""
        url = "/api/login/"
        
        # 1. Test successful login using Username
        login_data_username = {
            "email": "janesmith",
            "password": self.existing_password
        }
        print(f"\n[Step 1] Sending POST to {url} using valid Username: 'janesmith'")
        response = self.client.post(url, login_data_username, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Logged In User: {response.data.get('username')}, User ID: {response.data.get('userID')}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["userID"], self.user.UserID)
        self.assertEqual(response.data["username"], self.user.Username)

        # 2. Test successful login using Email
        login_data_email = {
            "email": "jane@example.com",
            "password": self.existing_password
        }
        print(f"[Step 2] Sending POST to {url} using valid Email: 'jane@example.com'")
        response = self.client.post(url, login_data_email, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Test failed login with invalid password
        invalid_password_data = {
            "email": "janesmith",
            "password": "wrongpassword"
        }
        print(f"[Step 3] Sending POST to {url} with wrong password")
        response = self.client.post(url, invalid_password_data, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        print(f" -> Response Error: {response.data.get('error')}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid password")

        # 4. Test failed login with non-existent user
        non_existent_data = {
            "email": "ghostuser",
            "password": "somepassword"
        }
        print(f"[Step 4] Sending POST to {url} with non-existent username 'ghostuser'")
        response = self.client.post(url, non_existent_data, format="json")
        print(f" -> Response Status: {response.status_code} Not Found")
        print(f" -> Response Error: {response.data.get('error')}")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "User not found")

