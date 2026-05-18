from django.db import models

class Category(models.Model):
    CategoryID   = models.AutoField(primary_key=True)
    CategoryType = models.CharField(max_length=50)

    class Meta:
        db_table = 'CATEGORY'

    def __str__(self):
        return self.CategoryType


class Product(models.Model):
    ProductID          = models.AutoField(primary_key=True)
    Category           = models.ForeignKey(Category, on_delete=models.CASCADE, db_column='CategoryID')
    ProductName        = models.CharField(max_length=100)
    ProductDescription = models.TextField(blank=True, null=True)
    StockQuantity      = models.IntegerField(default=0)
    UnitPrice          = models.DecimalField(max_digits=10, decimal_places=2)
    ProductImage       = models.ImageField(upload_to='products/', blank=True, null=True)

    class Meta:
        db_table = 'PRODUCT'

    def __str__(self):
        return self.ProductName


class User(models.Model):
    UserID = models.AutoField(primary_key=True)
    FirstName = models.CharField(max_length=50, blank=True, null=True)
    LastName = models.CharField(max_length=50, blank=True, null=True)
    Username = models.CharField(max_length=15, unique=True)
    Password = models.CharField(max_length=255)
    Email = models.EmailField(max_length=50, unique=True)
    ContactNum = models.CharField(max_length=15)
    Address = models.CharField(max_length=100)
    Barangay = models.CharField(max_length=100, blank=True, default='')  # Changed
    Municipality = models.CharField(max_length=100, blank=True, default='')  # Changed

    class Meta:
        db_table = 'USER'

    def __str__(self):
        return self.Username


class Admin(models.Model):
    AdminID  = models.AutoField(primary_key=True)
    Username = models.CharField(max_length=50, unique=True)
    Password = models.CharField(max_length=255)
    Email    = models.EmailField(max_length=100)

    class Meta:
        db_table = 'ADMIN'


class Cart(models.Model):
    CartID = models.AutoField(primary_key=True)
    User   = models.OneToOneField(User, on_delete=models.CASCADE, db_column='UserID')

    class Meta:
        db_table = 'CART'


class CartItem(models.Model):
    CartItemID      = models.AutoField(primary_key=True)
    Cart            = models.ForeignKey(Cart, on_delete=models.CASCADE, db_column='CartID')
    Product         = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='ProductID')
    ProductQuantity = models.IntegerField(default=1)

    class Meta:
        db_table = 'CART_ITEM'


class Voucher(models.Model):
    DISCOUNT_TYPES = [('percentage', 'Percentage'), ('fixed', 'Fixed Amount')]
    VoucherID     = models.AutoField(primary_key=True)
    VoucherCode   = models.CharField(max_length=50, unique=True)
    DiscountType  = models.CharField(max_length=10, choices=DISCOUNT_TYPES)
    DiscountValue = models.DecimalField(max_digits=10, decimal_places=2)
    MinPurchase   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    StartDate     = models.DateField()
    EndDate       = models.DateField()
    UsageLimit    = models.IntegerField(default=1)
    UsedCount     = models.IntegerField(default=0)
    IsActive      = models.BooleanField(default=True)
    PAYMENT_CONDITIONS = [
        ('both', 'Both (COD & Pickup)'),
        ('cod', 'Cash on Delivery Only'),
        ('pickup', 'Cash on Pickup Only'),
    ]
    
    PaymentMethodCondition = models.CharField(
        max_length=10, 
        choices=PAYMENT_CONDITIONS, 
        default='both'
    )
    MaxDiscount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    FirstPurchaseOnly = models.BooleanField(default=False)

    class Meta:
        db_table = 'VOUCHER'


class Order(models.Model):
    STATUS_CHOICES = [
        ('To Pay', 'To Pay'),
        ('Confirmed', 'Confirmed'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    OrderID        = models.AutoField(primary_key=True)
    User           = models.ForeignKey(User, on_delete=models.CASCADE, db_column='UserID')
    OrderDate      = models.DateTimeField(auto_now_add=True)
    OrderAmount    = models.DecimalField(max_digits=10, decimal_places=2)
    DiscountAmount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    QuantitySold   = models.IntegerField()
    PaymentType    = models.CharField(max_length=50)
    OrderStatus    = models.CharField(max_length=20, choices=STATUS_CHOICES, default='To Pay')
    DeliveryAddress= models.CharField(max_length=255, blank=True, null=True)
    PickupLocation = models.CharField(max_length=100, blank=True, null=True)
    PickupDate     = models.DateField(blank=True, null=True)
    PickupTimeSlot = models.CharField(max_length=50, blank=True, null=True)
    Voucher        = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, db_column='VoucherID')

    class Meta:
        db_table = 'ORDER'


class OrderItem(models.Model):
    OrderItemID     = models.AutoField(primary_key=True)
    Order           = models.ForeignKey(Order, on_delete=models.CASCADE, db_column='OrderID')
    Product         = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='ProductID')
    ProductQuantity = models.IntegerField()
    UnitPrice       = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'ORDER_ITEM'


class Favorite(models.Model):
    FavoriteID = models.AutoField(primary_key=True)
    User       = models.ForeignKey(User, on_delete=models.CASCADE, db_column='UserID')
    Product    = models.ForeignKey(Product, on_delete=models.CASCADE, db_column='ProductID')

    class Meta:
        db_table = 'FAVORITES'
        unique_together = ('User', 'Product')


class AdminLog(models.Model):
    LogID     = models.AutoField(primary_key=True)
    Admin     = models.ForeignKey(Admin, on_delete=models.CASCADE, db_column='AdminID')
    Action    = models.CharField(max_length=255)
    Timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ADMIN_LOG'