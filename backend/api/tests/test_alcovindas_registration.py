from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User, Cart

# ==============================================================================
# MEMBER: ALCOVINDAS, NYAN JEAN Q.
# ASSIGNED FEATURE: Account Registration & Validation (User Registration)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class AlcovindasRegistrationTests(APITestCase):
    """
    ALCOVINDAS, NYAN JEAN Q. - Test Case 1.1: User Registration
    """
    def test_user_registration(self):
        """Test Case 1.1: Verify successful user registration creates a new user and an associated cart."""
        url = "/api/register/"
        data = {
            "firstName": "John",
            "lastName": "Doe",
            "username": "johndoe",
            "password": "mypassword123",
            "email": "john@example.com",
            "contactNum": "09998887777",
            "address": "456 Main St, Quezon City"
        }
        
        print(f"\n[Step 1] Sending POST request to {url} with user details")
        response = self.client.post(url, data, format="json")
        print(f" -> Response Status: {response.status_code} Created")
        print(f" -> Response Message: {response.data.get('message')}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "Registered successfully")
        
        # Verify user exists in database
        print("[Step 2] Verifying User record exists in test database")
        user_exists = User.objects.filter(Username="johndoe").exists()
        print(f" -> User 'johndoe' exists in DB: {user_exists}")
        self.assertTrue(user_exists)
        
        # Verify an associated cart was automatically generated for this user
        print("[Step 3] Verifying associated Cart was automatically created for this User")
        new_user = User.objects.get(Username="johndoe")
        cart_exists = Cart.objects.filter(User=new_user).exists()
        print(f" -> Cart associated with User exists in DB: {cart_exists}")
        self.assertTrue(cart_exists)

