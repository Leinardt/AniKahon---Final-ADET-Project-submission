from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
import json
from .models import *
from .serializers import *   
from django.db.models import Q
from django.db.models import Sum

# ─── AUTH 

@csrf_exempt
@api_view(['POST'])
def register(request):
    data = request.data
    if User.objects.filter(Email=data.get('email')).exists():
        return Response({'error': 'Email already registered'}, status=400)
    if User.objects.filter(Username=data.get('username')).exists():
        return Response({'error': 'Username already taken'}, status=400)
    user = User.objects.create(
        FirstName  = data.get('firstName'),
        LastName   = data.get('lastName'),
        Username   = data.get('username'),
        Password   = make_password(data.get('password')),
        Email      = data.get('email'),
        ContactNum = data.get('contactNum', ''),
        Address    = data.get('address', ''),
    )
    Cart.objects.create(User=user)
    return Response({'message': 'Registered successfully'}, status=201)

@csrf_exempt
@csrf_exempt
@api_view(['POST'])
def login_view(request):
    data = request.data
    login_input = data.get('email')  # This could be email or username
    
    try:
        # Try to find user by email OR username
        user = User.objects.get(Q(Email=login_input) | Q(Username=login_input))
        
        if check_password(data.get('password'), user.Password):
            return Response({
                'userID': user.UserID,
                'username': user.Username,
                'firstName': user.FirstName,
                'email': user.Email,
            })
        return Response({'error': 'Invalid password'}, status=400)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    
@csrf_exempt
@api_view(['POST'])
def admin_login(request):
    data = request.data
    try:
        admin = Admin.objects.get(Username=data.get('username'))
        if check_password(data.get('password'), admin.Password):
            return Response({'adminID': admin.AdminID, 'username': admin.Username})
        return Response({'error': 'Invalid password'}, status=400)
    except Admin.DoesNotExist:
        return Response({'error': 'Admin not found'}, status=404)

# ─── PRODUCTS 

@api_view(['GET'])
def product_list(request):
    from django.db.models import Sum
    
    category = request.GET.get('category')
    sort_by = request.GET.get('sort', '')
    
    products = Product.objects.select_related('Category').all()
    
    if category:
        products = products.filter(Category__CategoryType__iexact=category)
    
    # Apply sorting (only if sort_by is not empty)
    if sort_by == 'price_asc':
        products = products.order_by('UnitPrice')
    elif sort_by == 'price_desc':
        products = products.order_by('-UnitPrice')
    elif sort_by == 'top_sales':
        products = products.annotate(
            total_sold=Sum('orderitem__ProductQuantity')
        ).order_by('-total_sold')
    # If no sort or sort is empty, keep default ordering
    
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        return Response(ProductSerializer(product, context={'request': request}).data)
    except Product.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

@api_view(['GET'])
def categories(request):
    cats = Category.objects.all()
    return Response(CategorySerializer(cats, many=True).data)

# ─── CART 

@api_view(['GET'])
def get_cart(request, user_id):
    try:
        cart  = Cart.objects.get(User_id=user_id)
        items = CartItem.objects.filter(Cart=cart).select_related('Product')
        return Response(CartItemSerializer(items, many=True, context={'request': request}).data)
    except Cart.DoesNotExist:
        return Response([])

@api_view(['POST'])
def add_to_cart(request):
    data = request.data
    user_id = data.get('userID')
    product_id = data.get('productID')
    qty = int(data.get('quantity', 1))
    
    try:
        cart, _ = Cart.objects.get_or_create(User_id=user_id)
        product = Product.objects.get(pk=product_id)
        
        if product.StockQuantity == 0:
            return Response({'error': 'Out of stock'}, status=400)
        
        item, created = CartItem.objects.get_or_create(Cart=cart, Product=product)
        new_qty = qty if created else item.ProductQuantity + qty
        
        if new_qty > 99:
            return Response({'error': 'Cart limit reached (max 99 per item)'}, status=400)
        if new_qty > product.StockQuantity:
            return Response({'error': f'Only {product.StockQuantity} available'}, status=400)
        
        item.ProductQuantity = new_qty
        item.save()
        
        return Response({'message': 'Added to cart'})  # No cartItemId needed
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

@api_view(['PUT'])
def update_cart_item(request, item_id):
    qty = int(request.data.get('quantity', 1))
    try:
        item = CartItem.objects.get(pk=item_id)
        if qty < 1:
            item.delete()
            return Response({'message': 'Item removed'})
        if qty > item.Product.StockQuantity:
            return Response({'error': f'Only {item.Product.StockQuantity} available'}, status=400)
        if qty > 99:
            return Response({'error': 'Max 99 per item'}, status=400)
        item.ProductQuantity = qty
        item.save()
        return Response({'message': 'Updated'})
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=404)

@api_view(['DELETE'])
def remove_cart_item(request, item_id):
    CartItem.objects.filter(pk=item_id).delete()
    return Response({'message': 'Removed'})

# ─── FAVORITES 

@api_view(['GET'])
def get_favorites(request, user_id):
    favs = Favorite.objects.filter(User_id=user_id).select_related('Product')
    return Response(FavoriteSerializer(favs, many=True, context={'request': request}).data)

@api_view(['POST'])
def toggle_favorite(request):
    data       = request.data
    user_id    = data.get('userID')
    product_id = data.get('productID')
    fav, created = Favorite.objects.get_or_create(User_id=user_id, Product_id=product_id)
    if not created:
        fav.delete()
        return Response({'favorited': False})
    return Response({'favorited': True})

# ─── VOUCHERS 

@api_view(['POST'])
def apply_voucher(request):
    from datetime import date
    from decimal import Decimal
    
    code = request.data.get('code')
    subtotal = Decimal(str(request.data.get('subtotal', 0)))
    payment_method = request.data.get('payment_method', 'both')
    user_id = request.data.get('user_id')
    
    if not code:
        return Response({'error': 'Voucher code is required'}, status=400)
    
    try:
        voucher = Voucher.objects.get(VoucherCode=code)
    except Voucher.DoesNotExist:
        return Response({'error': 'Invalid voucher code'}, status=404)
    
    if not voucher.IsActive:
        return Response({'error': 'This voucher is not active'}, status=400)
    
    today = date.today()
    if voucher.StartDate and voucher.StartDate > today:
        return Response({'error': f'Voucher starts on {voucher.StartDate}'}, status=400)
    if voucher.EndDate and voucher.EndDate < today:
        return Response({'error': f'Voucher expired on {voucher.EndDate}'}, status=400)
    
    if voucher.UsedCount >= voucher.UsageLimit:
        return Response({'error': 'Voucher usage limit reached'}, status=400)
    
    if subtotal < voucher.MinPurchase:
        return Response({'error': f'Minimum purchase of ₱{voucher.MinPurchase} required'}, status=400)
    
    if voucher.PaymentMethodCondition != 'both' and voucher.PaymentMethodCondition != payment_method:
        if voucher.PaymentMethodCondition == 'cod':
            return Response({'error': 'This voucher is only valid for Cash on Delivery'}, status=400)
        elif voucher.PaymentMethodCondition == 'pickup':
            return Response({'error': 'This voucher is only valid for Cash on Pickup'}, status=400)
    
    if voucher.FirstPurchaseOnly:
        has_orders = Order.objects.filter(User_id=user_id).exists()
        if has_orders:
            return Response({'error': 'This voucher is for first-time purchases only'}, status=400)
    
    if voucher.DiscountType == 'percentage':
        discount = subtotal * (voucher.DiscountValue / 100)
    else:
        discount = voucher.DiscountValue
    
    if voucher.MaxDiscount and voucher.MaxDiscount > 0 and discount > voucher.MaxDiscount:
        discount = voucher.MaxDiscount
    
    return Response({
        'voucherID': voucher.VoucherID,
        'discount': float(discount),
        'code': voucher.VoucherCode,
        'maxDiscount': float(voucher.MaxDiscount) if voucher.MaxDiscount else None,
    })

# ─── ORDERS

@api_view(['POST'])
def place_order(request):
    data       = request.data
    user_id    = data.get('userID')
    items      = data.get('items', [])
    pay_type   = data.get('paymentType')
    total      = Decimal(str(data.get('total', 0)))
    discount   = Decimal(str(data.get('discount', 0)))
    voucher_id = data.get('voucherID')

    total_qty = sum(i['quantity'] for i in items)
    order = Order.objects.create(
        User_id        = user_id,
        OrderAmount    = total,
        DiscountAmount = discount,
        QuantitySold   = total_qty,
        PaymentType    = pay_type,
        DeliveryAddress= data.get('deliveryAddress'),
        PickupLocation = data.get('pickupLocation'),
        PickupDate     = data.get('pickupDate'),
        PickupTimeSlot = data.get('pickupTimeSlot'),
        Voucher_id     = voucher_id,
    )

    for item in items:
        product = Product.objects.get(pk=item['productID'])
        OrderItem.objects.create(
            Order           = order,
            Product         = product,
            ProductQuantity = item['quantity'],
            UnitPrice       = item['unitPrice'],
        )
        product.StockQuantity -= item['quantity']
        product.save()

    if voucher_id:
        Voucher.objects.filter(pk=voucher_id).update(UsedCount=models.F('UsedCount') + 1)

    cart_item_ids = data.get('cartItemIDs', [])
    CartItem.objects.filter(pk__in=cart_item_ids).delete()

    return Response({'orderID': order.OrderID, 'message': 'Order placed successfully'}, status=201)

@api_view(['GET'])
def get_orders(request, user_id):
    orders = Order.objects.filter(User_id=user_id).prefetch_related('orderitem_set__Product').order_by('-OrderDate')
    return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

@api_view(['PUT'])
def cancel_order(request, order_id):
    try:
        order = Order.objects.get(pk=order_id)
        if order.OrderStatus not in ['To Pay']:
            return Response({'error': 'Cannot cancel this order'}, status=400)
        for item in order.orderitem_set.all():
            item.Product.StockQuantity += item.ProductQuantity
            item.Product.save()
        order.OrderStatus = 'Cancelled'
        order.save()
        return Response({'message': 'Order cancelled'})
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

# ─── USER PROFILE

@api_view(['GET', 'PUT'])
def user_profile(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        if request.method == 'GET':
            return Response(UserSerializer(user).data)
        data = request.data
        user.FirstName = data.get('firstName', user.FirstName)
        user.LastName = data.get('lastName', user.LastName)
        user.Email = data.get('email', user.Email)
        user.Username = data.get('username', user.Username)
        user.ContactNum = data.get('contactNum', user.ContactNum)
        user.Address = data.get('address', user.Address)
        user.Barangay = data.get('barangay', user.Barangay or '')  # Add this
        user.Municipality = data.get('municipality', user.Municipality or '')  # Add this
        
        if data.get('newPassword'):
            if not check_password(data.get('currentPassword'), user.Password):
                return Response({'error': 'Current password is wrong'}, status=400)
            user.Password = make_password(data.get('newPassword'))
        user.save()
        return Response({'message': 'Profile updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

# ─── ADMIN 

@api_view(['GET'])
def admin_orders(request):
    orders = Order.objects.all().prefetch_related('orderitem_set__Product').select_related('User').order_by('-OrderDate')
    return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

@api_view(['PUT'])
def admin_update_order(request, order_id):
    admin_id = request.data.get('adminID')
    new_status = request.data.get('status')
    try:
        order = Order.objects.get(pk=order_id)
        old_status = order.OrderStatus
        order.OrderStatus = new_status
        if new_status == 'Cancelled' and old_status == 'To Pay':
            for item in order.orderitem_set.all():
                item.Product.StockQuantity += item.ProductQuantity
                item.Product.save()
        order.save()
        AdminLog.objects.create(Admin_id=admin_id, Action=f'Order #{order_id} status changed to {new_status}')
        return Response({'message': 'Order updated'})
    except Order.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

@api_view(['GET', 'POST'])
def admin_products(request):
    if request.method == 'GET':
        products = Product.objects.select_related('Category').all()
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)
    admin_id = request.data.get('adminID')
    product = Product.objects.create(
        Category_id        = request.data.get('categoryID'),
        ProductName        = request.data.get('productName'),
        ProductDescription = request.data.get('description'),
        StockQuantity      = int(request.data.get('stock', 0)),
        UnitPrice          = Decimal(request.data.get('price', 0)),
    )
    if 'image' in request.FILES:
        product.ProductImage = request.FILES['image']
        product.save()
    AdminLog.objects.create(Admin_id=admin_id, Action=f'Added product: {product.ProductName}')
    return Response({'message': 'Product added', 'productID': product.ProductID}, status=201)

@api_view(['PUT', 'DELETE'])
def admin_product_detail(request, pk):
    admin_id = request.data.get('adminID')
    try:
        product = Product.objects.get(pk=pk)
        if request.method == 'DELETE':
            name = product.ProductName
            product.delete()
            AdminLog.objects.create(Admin_id=admin_id, Action=f'Deleted product: {name}')
            return Response({'message': 'Deleted'})
        product.ProductName        = request.data.get('productName', product.ProductName)
        product.ProductDescription = request.data.get('description', product.ProductDescription)
        product.StockQuantity      = max(0, int(request.data.get('stock', product.StockQuantity)))
        product.UnitPrice          = Decimal(request.data.get('price', product.UnitPrice))
        product.Category_id        = request.data.get('categoryID', product.Category_id)
        if 'image' in request.FILES:
            product.ProductImage = request.FILES['image']
        product.save()
        AdminLog.objects.create(Admin_id=admin_id, Action=f'Updated product: {product.ProductName}')
        return Response({'message': 'Updated'})
    except Product.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

@api_view(['GET', 'POST'])
def admin_vouchers(request):
    admin_id = request.data.get('adminID') if request.method == 'POST' else None
    if request.method == 'GET':
        return Response(VoucherSerializer(Voucher.objects.all(), many=True).data)
    v = Voucher.objects.create(
        VoucherCode   = request.data.get('code'),
        DiscountType  = request.data.get('discountType'),
        DiscountValue = Decimal(request.data.get('discountValue', 0)),
        MinPurchase   = Decimal(request.data.get('minPurchase', 0)),
        StartDate     = request.data.get('startDate'),
        EndDate       = request.data.get('endDate'),
        UsageLimit    = int(request.data.get('usageLimit', 1)),
    )
    AdminLog.objects.create(Admin_id=admin_id, Action=f'Created voucher: {v.VoucherCode}')
    return Response({'message': 'Voucher created'}, status=201)

@api_view(['PUT', 'DELETE'])
def admin_voucher_detail(request, pk):
    admin_id = request.data.get('adminID')
    try:
        v = Voucher.objects.get(pk=pk)
        if request.method == 'DELETE':
            v.delete()
            AdminLog.objects.create(Admin_id=admin_id, Action=f'Deleted voucher: {v.VoucherCode}')
            return Response({'message': 'Deleted'})
        v.IsActive = request.data.get('isActive', v.IsActive)
        v.save()
        AdminLog.objects.create(Admin_id=admin_id, Action=f'Updated voucher: {v.VoucherCode}')
        return Response({'message': 'Updated'})
    except Voucher.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

@api_view(['GET'])
def admin_reports(request):
    from django.db.models import Sum, Count
    report_type = request.GET.get('type', 'sales')
    date_from   = request.GET.get('from')
    date_to     = request.GET.get('to')

    if report_type == 'sales':
        qs = Order.objects.filter(OrderStatus='Completed')
        if date_from:
            qs = qs.filter(OrderDate__date__gte=date_from)
        if date_to:
            qs = qs.filter(OrderDate__date__lte=date_to)
        total = qs.aggregate(total=Sum('OrderAmount'))['total'] or 0
        count = qs.count()
        return Response({'totalSales': float(total), 'orderCount': count})

    if report_type == 'products':
        products = Product.objects.annotate(
            times_ordered=Count('orderitem')
        ).values('ProductID', 'ProductName', 'StockQuantity', 'times_ordered')
        return Response(list(products))

    return Response({'error': 'Unknown report type'}, status=400)
@api_view(['GET'])
def available_vouchers(request, user_id):
    from decimal import Decimal
    
    payment_method = request.GET.get('payment_method', 'both')
    
    from datetime import date
    today = date.today()
    
    try:
        cart = Cart.objects.get(User_id=user_id)
        items = CartItem.objects.filter(Cart=cart)
        subtotal = sum(item.Product.UnitPrice * item.ProductQuantity for item in items)
    except Cart.DoesNotExist:
        subtotal = 0
    
    has_orders = Order.objects.filter(User_id=user_id).exists()
    
    all_vouchers = Voucher.objects.filter(IsActive=True)
    
    available = []
    for v in all_vouchers:
        if v.StartDate and v.StartDate > today:
            continue  # Not started yet
        if v.EndDate and v.EndDate < today:
            continue  # Already expired
        
        if v.UsedCount >= v.UsageLimit:
            continue
        
        is_applicable = True
        disabled_reason = None
      
        if subtotal < v.MinPurchase:
            is_applicable = False
            disabled_reason = f'Requires minimum purchase of ₱{v.MinPurchase}'
        
        if v.PaymentMethodCondition != 'both' and v.PaymentMethodCondition != payment_method:
            is_applicable = False
            disabled_reason = f'Only valid for {v.get_PaymentMethodCondition_display()}'
        
        if v.FirstPurchaseOnly and has_orders:
            is_applicable = False
            disabled_reason = 'First purchase only'
        
        if v.DiscountType == 'percentage':
            calculated = subtotal * (v.DiscountValue / 100)
        else:
            calculated = v.DiscountValue
        
        if v.MaxDiscount and v.MaxDiscount > 0 and calculated > v.MaxDiscount:
            calculated = v.MaxDiscount
        
        available.append({
            'VoucherID': v.VoucherID,
            'VoucherCode': v.VoucherCode,
            'DiscountType': v.DiscountType,
            'DiscountValue': float(v.DiscountValue),
            'MinPurchase': float(v.MinPurchase),
            'MaxDiscount': float(v.MaxDiscount) if v.MaxDiscount else None,
            'PaymentMethodCondition': v.PaymentMethodCondition,
            'FirstPurchaseOnly': v.FirstPurchaseOnly,
            'calculatedDiscount': float(calculated),
            'is_applicable': is_applicable,
            'disabled_reason': disabled_reason,
        })
    
    return Response(available)