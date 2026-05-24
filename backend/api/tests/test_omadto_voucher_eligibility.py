from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from api.models import User, Voucher, Order

# ==============================================================================
# MEMBER: OMADTO, LEINARDT R.
# ASSIGNED FEATURE: Voucher Discounts & Eligibility (Voucher Eligibility Constraints)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class OmadtoVoucherEligibilityTests(APITestCase):
    """
    OMADTO, LEINARDT R. - Test Case 3.2: Voucher Eligibility
    """
    def setUp(self):
        self.user = User.objects.create(
            Username="shopper1",
            Password=make_password("pass123"),
            Email="shopper1@example.com"
        )
        self.pct_voucher = Voucher.objects.create(
            VoucherCode="SUMMER20",
            DiscountType="percentage",
            DiscountValue=Decimal("20.00"),
            MinPurchase=Decimal("500.00"),
            MaxDiscount=Decimal("150.00"),
            StartDate=date.today() - timedelta(days=2),
            EndDate=date.today() + timedelta(days=2),
            UsageLimit=10,
            UsedCount=0,
            IsActive=True,
            PaymentMethodCondition="both"
        )
        self.fixed_cod_voucher = Voucher.objects.create(
            VoucherCode="COD100",
            DiscountType="fixed",
            DiscountValue=Decimal("100.00"),
            MinPurchase=Decimal("300.00"),
            StartDate=date.today() - timedelta(days=2),
            EndDate=date.today() + timedelta(days=2),
            UsageLimit=5,
            UsedCount=0,
            IsActive=True,
            PaymentMethodCondition="cod"
        )
        self.first_only_voucher = Voucher.objects.create(
            VoucherCode="NEWUSER",
            DiscountType="fixed",
            DiscountValue=Decimal("50.00"),
            MinPurchase=Decimal("100.00"),
            StartDate=date.today() - timedelta(days=1),
            EndDate=date.today() + timedelta(days=5),
            FirstPurchaseOnly=True,
            IsActive=True,
            PaymentMethodCondition="both"
        )

    def test_apply_voucher_eligibility_constraints(self):
        """Test Case 3.2: Verify vouchers are blocked if they do not satisfy eligibility conditions."""
        url = "/api/voucher/apply/"

        # 1. Min Purchase constraint: subtotal 400 is less than SUMMER20's min purchase of 500
        data_min_purchase = {
            "code": "SUMMER20",
            "subtotal": 400.00,
            "payment_method": "both",
            "user_id": self.user.UserID
        }
        print(f"\n[Step 1] Applying 'SUMMER20' (Min Purchase: 500) with subtotal 400.00")
        response = self.client.post(url, data_min_purchase, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        error_msg = response.data.get('error', '').replace('₱', 'PHP')
        print(f" -> Response Error: {error_msg}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Minimum purchase", response.data["error"])

        # 2. Payment Method constraint: COD100 applied to "pickup" payment method instead of "cod"
        data_payment_method = {
            "code": "COD100",
            "subtotal": 400.00,
            "payment_method": "pickup",
            "user_id": self.user.UserID
        }
        print(f"[Step 2] Applying 'COD100' (COD only) with payment_method set to 'pickup'")
        response = self.client.post(url, data_payment_method, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        error_msg = response.data.get('error', '').replace('₱', 'PHP')
        print(f" -> Response Error: {error_msg}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("only valid for Cash on Delivery", response.data["error"])

        # 3. First Purchase Only constraint: Create an order for user and verify they can no longer use NEWUSER
        Order.objects.create(
            User=self.user,
            OrderAmount=Decimal("200.00"),
            QuantitySold=1,
            PaymentType="COD"
        )
        data_first_purchase = {
            "code": "NEWUSER",
            "subtotal": 200.00,
            "payment_method": "both",
            "user_id": self.user.UserID
        }
        print(f"[Step 3] Applying 'NEWUSER' (First Purchase Only) after placing a previous order in database")
        response = self.client.post(url, data_first_purchase, format="json")
        print(f" -> Response Status: {response.status_code} Bad Request")
        error_msg = response.data.get('error', '').replace('₱', 'PHP')
        print(f" -> Response Error: {error_msg}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "This voucher is for first-time purchases only")


