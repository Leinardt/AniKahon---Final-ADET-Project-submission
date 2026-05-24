from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from decimal import Decimal
from api.models import User, Category, Product, Cart, Order, OrderItem

# ==============================================================================
# MEMBER: PANCHO, RHONA MAE R.
# ASSIGNED FEATURE: Orders & Inventory Integrity (Order Cancellation)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class PanchoOrderCancelTests(APITestCase):
    """
    PANCHO, RHONA MAE R. - Test Case 4.2: Order Cancellation
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

    def test_cancel_order_restore_stock(self):
        """Test Case 4.2: Verify order cancellation restores product stock and updates order status."""
        # 1. Setup mock order with 2 units of the product bought, decreasing stock to 8
        order = Order.objects.create(
            User=self.user,
            OrderAmount=Decimal("300.00"),
            QuantitySold=2,
            PaymentType="COD",
            OrderStatus="To Pay"
        )
        OrderItem.objects.create(
            Order=order,
            Product=self.product,
            ProductQuantity=2,
            UnitPrice=Decimal("150.00")
        )
        self.product.StockQuantity -= 2
        self.product.save()

        # Send cancellation request
        url = f"/api/orders/{order.OrderID}/cancel/"
        print(f"\n[Step 1] Sending PUT request to {url}")
        response = self.client.put(url, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Response Message: {response.data['message']}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Order cancelled")

        # Verify Order status is now 'Cancelled'
        order.refresh_from_db()
        print(f"[Step 2] Checking Order Status in Database")
        print(f" -> Order Status: {order.OrderStatus}")
        self.assertEqual(order.OrderStatus, "Cancelled")

        # Verify product inventory stock is restored: 8 + 2 = 10
        self.product.refresh_from_db()
        print(f"[Step 3] Verifying Stock Restoration (Originally 10, dropped to 8, restored after cancel)")
        print(f" -> Final Stock Quantity: {self.product.StockQuantity}")
        self.assertEqual(self.product.StockQuantity, 10)

