from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/',        views.register,      name='register'),
    path('login/',           views.login_view,    name='login'),
    path('admin/login/',     views.admin_login,   name='admin_login'),

    # Products
    path('products/',                  views.product_list,         name='products'),
    path('products/<int:pk>/',         views.product_detail,       name='product_detail'),
    path('categories/',                views.categories,           name='categories'),

    # Cart
    path('cart/<int:user_id>/',        views.get_cart,             name='get_cart'),
    path('cart/add/',                  views.add_to_cart,          name='add_to_cart'),
    path('cart/item/<int:item_id>/',   views.update_cart_item,     name='update_cart_item'),
    path('cart/item/<int:item_id>/remove/', views.remove_cart_item, name='remove_cart_item'),

    # Favorites
    path('favorites/<int:user_id>/',   views.get_favorites,        name='get_favorites'),
    path('favorites/toggle/',          views.toggle_favorite,      name='toggle_favorite'),

    # Vouchers (customer)
    path('voucher/apply/',             views.apply_voucher,        name='apply_voucher'),
    path('vouchers/available/<int:user_id>/', views.available_vouchers, name='available_vouchers'),

    # Orders
    path('orders/place/',              views.place_order,          name='place_order'),
    path('orders/<int:user_id>/',      views.get_orders,           name='get_orders'),
    path('orders/<int:order_id>/cancel/', views.cancel_order,      name='cancel_order'),

    # User profile
    path('user/<int:user_id>/',        views.user_profile,         name='user_profile'),

    # Admin
    path('admin/orders/',              views.admin_orders,         name='admin_orders'),
    path('admin/orders/<int:order_id>/update/', views.admin_update_order, name='admin_update_order'),
    path('admin/products/',            views.admin_products,       name='admin_products'),
    path('admin/products/<int:pk>/',   views.admin_product_detail, name='admin_product_detail'),
    path('admin/vouchers/',            views.admin_vouchers,       name='admin_vouchers'),
    path('admin/vouchers/<int:pk>/',   views.admin_voucher_detail, name='admin_voucher_detail'),
    path('admin/reports/',             views.admin_reports,        name='admin_reports'),
    path('gabai/chat/',                views.gabai_chat,           name='gabai_chat'),
]
