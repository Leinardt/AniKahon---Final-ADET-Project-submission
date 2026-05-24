from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from api.models import User, Category, Product, Cart, CartItem, Voucher

# ==============================================================================
# MEMBER: PANCHO, RHONA MAE R.
# ASSIGNED FEATURE: Orders & Inventory Integrity (Order Placement)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class PanchoOrderPlaceTests(APITestCase):
    """
    PANCHO, RHONA MAE R. - Test Case 4.1: Order Placement
    """
    def setUp(self):
        self.user = User.objects.create(
            Username="checkout_user",
            Password=make_password("pass123"),
            Email="checkout@example.com"
        )
        self.cart = Cart.objects.create(User=self.user)
        self.category = Category.objects.create(CategoryType="Earrings")
        self.product = Product.objects.create(
            Category=self.category,
            ProductName="Crochet Daisy Earrings",
            StockQuantity=10,
            UnitPrice=Decimal("150.00")
        )
        self.cart_item = CartItem.objects.create(
            Cart=self.cart,
            Product=self.product,
            ProductQuantity=2
        )
        self.voucher = Voucher.objects.create(
            VoucherCode="DISCOUNT50",
            DiscountType="fixed",
            DiscountValue=Decimal("50.00"),
            MinPurchase=Decimal("100.00"),
            StartDate=date.today() - timedelta(days=1),
            EndDate=date.today() + timedelta(days=5),
            UsageLimit=5,
            UsedCount=0,
            IsActive=True,
            PaymentMethodCondition="both"
        )

    def test_place_order_decrement_stock_clear_cart(self):
        """Test Case 4.1: Verify checkout decrements inventory stock, increments voucher usage, and clears cart items."""
        url = "/api/orders/place/"
        
        # Subtotal: 2 * 150 = 300. Applied flat 50 discount -> Total = 250.
        order_data = {
            "userID": self.user.UserID,
            "items": [
                {
                    "productID": self.product.ProductID,
                    "quantity": 2,
                    "unitPrice": 150.00
                }
            ],
            "paymentType": "COD",
            "total": 250.00,
            "discount": 50.00,
            "voucherID": self.voucher.VoucherID,
            "deliveryAddress": "456 Daisy Rd, Taguig",
            "cartItemIDs": [self.cart_item.CartItemID]
        }

        print(f"\n[Step 1] Placing Order with 2 units of '{self.product.ProductName}' (Subtotal: 300, Discount: 50, Total: 250)")
        response = self.client.post(url, order_data, format="json")
        print(f" -> Response Status: {response.status_code} Created")
        print(f" -> Created Order ID: {response.data.get('orderID')}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("orderID", response.data)
        
        # 1. Verify product stock is decremented: 10 - 2 = 8
        print("[Step 2] Verifying Product Inventory Stock Decrement")
        self.product.refresh_from_db()
        print(f" -> Product Stock in DB (Originally 10, sold 2): {self.product.StockQuantity}")
        self.assertEqual(self.product.StockQuantity, 8)

        # 2. Verify voucher UsedCount is incremented from 0 to 1
        print("[Step 3] Verifying Voucher Usage Count Increment")
        self.voucher.refresh_from_db()
        print(f" -> Voucher Used Count in DB (Originally 0): {self.voucher.UsedCount}")
        self.assertEqual(self.voucher.UsedCount, 1)

        # 3. Verify cart items listed in cartItemIDs are deleted
        print("[Step 4] Verifying Cart Cleanup (Checkout items removed from active Cart)")
        cart_items_count = CartItem.objects.filter(Cart=self.cart).count()
        print(f" -> Active items remaining in User's Cart: {cart_items_count}")
        self.assertEqual(cart_items_count, 0)

