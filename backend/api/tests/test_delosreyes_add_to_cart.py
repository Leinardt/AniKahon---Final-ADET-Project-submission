from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from decimal import Decimal
from api.models import User, Category, Product, Cart, CartItem

# ==============================================================================
# MEMBER: DELOS REYES, LANCE CHRISTOPHER T.
# ASSIGNED FEATURE: Cart CRUD Operations (Adding to Cart)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class DelosReyesAddToCartTests(APITestCase):
    """
    DELOS REYES, LANCE CHRISTOPHER T. - Test Case 2.1: Add to Cart
    """
    def setUp(self):
        # Set up categories and products
        self.category = Category.objects.create(CategoryType="Keychains")
        self.product = Product.objects.create(
            Category=self.category,
            ProductName="Crochet Sunflower Keychain",
            ProductDescription="A beautiful handmade crochet keychain.",
            StockQuantity=5,
            UnitPrice=Decimal("120.00")
        )
        self.out_of_stock_product = Product.objects.create(
            Category=self.category,
            ProductName="Crochet Tulip Keychain",
            ProductDescription="Out of stock item.",
            StockQuantity=0,
            UnitPrice=Decimal("110.00")
        )
        self.user = User.objects.create(
            Username="buyer1",
            Password=make_password("pass123"),
            Email="buyer1@example.com"
        )
        self.cart = Cart.objects.create(User=self.user)

    def test_add_to_cart(self):
        """Test Case 2.1: Verify items can be added to the cart, honoring stock checks."""
        url = "/api/cart/add/"
        
        # 1. Try to add an out-of-stock product
        oos_data = {
            "userID": self.user.UserID,
            "productID": self.out_of_stock_product.ProductID,
            "quantity": 1
        }
        print(f"\n[Step 1] Attempting to add Out of Stock product '{self.out_of_stock_product.ProductName}' to Cart")
        response = self.client.post(url, oos_data, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        print(f" -> Response Error: {response.data.get('error')}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Out of stock")

        # 2. Add an in-stock product successfully
        valid_data = {
            "userID": self.user.UserID,
            "productID": self.product.ProductID,
            "quantity": 2
        }
        print(f"[Step 2] Adding in-stock product '{self.product.ProductName}' (Stock: 5) to Cart with quantity: 2")
        response = self.client.post(url, valid_data, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        
        # Verify CartItem created in database
        cart_item = CartItem.objects.get(Cart=self.cart, Product=self.product)
        print(f" -> Verified in DB - CartItem quantity: {cart_item.ProductQuantity}")
        self.assertEqual(cart_item.ProductQuantity, 2)

        # 3. Add more than available stock
        excess_data = {
            "userID": self.user.UserID,
            "productID": self.product.ProductID,
            "quantity": 4 # total would be 2 + 4 = 6, but stock is 5
        }
        print(f"[Step 3] Attempting to add excess quantity (+4) exceeding available stock limit of 5")
        response = self.client.post(url, excess_data, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        print(f" -> Response Error: {response.data.get('error')}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("available", response.data["error"])

