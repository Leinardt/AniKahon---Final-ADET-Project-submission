from rest_framework.test import APITestCase
from django.contrib.auth.hashers import make_password
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from api.models import User, Voucher

# ==============================================================================
# MEMBER: OMADTO, LEINARDT R.
# ASSIGNED FEATURE: Voucher Discounts & Eligibility (Voucher Discount Calculation)
# TYPE OF TEST: Integration / API Testing
# TOOL/FRAMEWORK USED: Django Test Framework (Python)
# ==============================================================================

class OmadtoVoucherCalcTests(APITestCase):
    """
    OMADTO, LEINARDT R. - Test Case 3.1: Voucher Calculations
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

    def test_apply_voucher_discount_calculation(self):
        """Test Case 3.1: Verify discount values are computed correctly and capped if a limit is set."""
        url = "/api/voucher/apply/"
        
        # 1. Test percentage discount below the cap: 20% of 600 PHP = 120 PHP discount
        data_normal = {
            "code": "SUMMER20",
            "subtotal": 600.00,
            "payment_method": "both",
            "user_id": self.user.UserID
        }
        print(f"\n[Step 1] Applying percentage voucher 'SUMMER20' (20% off, max 150) on subtotal 600.00")
        response = self.client.post(url, data_normal, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Calculated Discount: {response.data.get('discount')} PHP")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["discount"], 120.00)

        # 2. Test percentage discount exceeding the cap: 20% of 1000 PHP = 200 PHP, but capped at 150 PHP
        data_capped = {
            "code": "SUMMER20",
            "subtotal": 1000.00,
            "payment_method": "both",
            "user_id": self.user.UserID
        }
        print(f"[Step 2] Applying 'SUMMER20' on subtotal 1000.00 (Uncapped: 200, Capping limit: 150)")
        response = self.client.post(url, data_capped, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Capped Discount Applied: {response.data.get('discount')} PHP")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["discount"], 150.00)

        # 3. Test fixed discount calculation: Flat 100 PHP off 500 PHP
        data_fixed = {
            "code": "COD100",
            "subtotal": 500.00,
            "payment_method": "cod",
            "user_id": self.user.UserID
        }
        print(f"[Step 3] Applying flat voucher 'COD100' (Flat 100 off) on subtotal 500.00")
        response = self.client.post(url, data_fixed, format="json")
        print(f" -> Response Status: {response.status_code} OK")
        print(f" -> Flat Discount Applied: {response.data.get('discount')} PHP")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["discount"], 100.00)

