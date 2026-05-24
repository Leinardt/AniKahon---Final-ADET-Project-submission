from rest_framework import serializers
from .models import *
from django.db.models import Sum

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    CategoryType = serializers.CharField(source='Category.CategoryType', read_only=True)
    image_url = serializers.SerializerMethodField()
    total_sold = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['ProductID', 'ProductName', 'ProductDescription', 'StockQuantity',
                  'UnitPrice', 'Category_id', 'CategoryType', 'image_url', 
                  'total_sold', 'average_rating']

    def get_image_url(self, obj):
        if obj.ProductImage:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.ProductImage.url) if request else obj.ProductImage.url
        return None

    def get_total_sold(self, obj):
        from django.db.models import Sum
        total = obj.orderitem_set.aggregate(total=Sum('ProductQuantity'))['total']
        return total or 0

    def get_average_rating(self, obj):
        return 0


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['UserID', 'FirstName', 'LastName', 'Username', 'Email', 
                  'ContactNum', 'Address', 'Barangay', 'Municipality']

class CartItemSerializer(serializers.ModelSerializer):
    Product = ProductSerializer(read_only=True)

    class Meta:
        model  = CartItem
        fields = ['CartItemID', 'Product', 'ProductQuantity']


class OrderItemSerializer(serializers.ModelSerializer):
    ProductName = serializers.CharField(source='Product.ProductName', read_only=True)
    image_url   = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ['OrderItemID', 'Product_id', 'ProductName', 'ProductQuantity', 'UnitPrice', 'image_url']

    def get_image_url(self, obj):
        if obj.Product.ProductImage:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.Product.ProductImage.url) if request else None
        return None


class OrderSerializer(serializers.ModelSerializer):
    items    = OrderItemSerializer(source='orderitem_set', many=True, read_only=True)
    Username = serializers.CharField(source='User.Username', read_only=True)

    class Meta:
        model  = Order
        fields = ['OrderID', 'OrderDate', 'OrderAmount', 'DiscountAmount', 'QuantitySold',
                  'PaymentType', 'OrderStatus', 'DeliveryAddress', 'PickupLocation',
                  'PickupDate', 'PickupTimeSlot', 'items', 'Username', 'User_id']


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Voucher
        fields = '__all__'


class FavoriteSerializer(serializers.ModelSerializer):
    Product = ProductSerializer(read_only=True)

    class Meta:
        model  = Favorite
        fields = ['FavoriteID', 'Product']