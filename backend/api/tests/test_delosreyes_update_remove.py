from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from decimal import Decimal
from api.models import User, Category, Product, Cart, CartItem

# ==============================================================================
# MEMBER: DELOS REYES, LANCE CHRISTOPHER T.
# ASSIGNED FEATURE: Cart CRUD Operations (Updating/Removing Item)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class DelosReyesUpdateRemoveTests(APITestCase):
    """
    DELOS REYES, LANCE CHRISTOPHER T. - Test Case 2.2: Update and Remove Cart Item
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
        self.user = User.objects.create(
            Username="buyer1",
            Password=make_password("pass123"),
            Email="buyer1@example.com"
        )
        self.cart = Cart.objects.create(User=self.user)

    def test_update_and_remove_cart_item(self):
        """Test Case 2.2: Verify cart quantities can be updated and items removed."""
        # Setup initial cart item
        cart_item = CartItem.objects.create(Cart=self.cart, Product=self.product, ProductQuantity=1)
        
        # 1. Update quantity successfully
        url_update = f"/api/cart/item/{cart_item.CartItemID}/"
        update_data = {"quantity": 3}
        print(f"\n[Step 1] Updating CartItem quantity from 1 to 3 (Valid Stock: 5)")
        response = self.client.put(url_update, update_data, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Response Message: {response.data.get('message')}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Updated")
        
        cart_item.refresh_from_db()
        print(f" -> Verified in DB - New CartItem quantity: {cart_item.ProductQuantity}")
        self.assertEqual(cart_item.ProductQuantity, 3)

        # 2. Update with quantity exceeding stock
        exceed_data = {"quantity": 10} # stock is 5
        print(f"[Step 2] Attempting to update CartItem quantity to 10 (Exceeds Stock limit of 5)")
        response = self.client.put(url_update, exceed_data, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        print(f" -> Response Error: {response.data.get('error')}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 3. Update with quantity < 1 (should remove item)
        remove_data = {"quantity": 0}
        print(f"[Step 3] Setting CartItem quantity to 0 (Should automatically trigger DB deletion)")
        response = self.client.put(url_update, remove_data, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Response Message: {response.data.get('message')}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Item removed")
        
        item_exists = CartItem.objects.filter(pk=cart_item.CartItemID).exists()
        print(f" -> Verified in DB - CartItem still exists: {item_exists}")
        self.assertFalse(item_exists)

