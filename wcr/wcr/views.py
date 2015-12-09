from django.http import HttpResponse
from django.shortcuts import *

from wcr.models import Product
from wcr.models import ProductDetail
from wcr.models import Blog
from wcr.cart import Cart
from wcr.models import Contact
from wcr.models import Faq

def index(request):
	context = {'index' : 'index'}
	return render(request, 'index.html', context)

def wholesale(request):
	context ={'wholesale' : 'wholesale'}
	return render(request, 'wholesale.html', context)

def detail(request, product_id):
	product = get_object_or_404(Product, pk=product_id)
	details = get_object_or_404(ProductDetail, pk=product_id)
	total =get_cart_count(request)
	return render(request, 'detail.html', {'details' : details, 'totalNcart' : total})

def shop(request):
	all_product_list = Product.objects.all()
	total =get_cart_count(request)
	context = {'all_products' : all_product_list, 'totalNcart' : total}
	request.session.set_expiry(300)
	return render(request, 'shop.html', context)

def about(request):
	context = {'about' : 'about'}
	return render(request, 'about.html', context)

def add_to_cart(request, product_id, quantity):
    product = Product.objects.get(id=product_id)
    cart = Cart(request)
    cart.add(product, product.price_in_dollars, quantity)
    return shop(request)
   
def clear_cart(request):
	cart = Cart(request)
	cart.clear()
	request.session.clear()
	return shop(request)

def remove_from_cart(request, product_id):
    product = Product.objects.get(id=product_id)
    _cart = Cart(request)
    _cart.remove(product)
    return cart(request)

def get_cart_count(request):
	cart = Cart(request)
	return cart.itemCount()

def cart(request):
    return render_to_response('cart.html', dict(cart=Cart(request)))

def blog(request):
	all_blogs_list = Blog.objects.all()	
	context = {'all_blogs' : all_blogs_list}
	return render(request, 'blog.html', context)

def help(request):
        all_faqs_list = Faq.objects.all()
        context = {'all_faqs' : all_faqs_list}
        return render(request, 'help.html', context)

def weekendsperfectcup(request):
	context = {'weekendsperfectcup' : 'weekendsperfectcup'}
	return render(request, 'weekendsperfectcup.html', context)

def theroasters(request):
	context = {'theroasters' : 'theroasters'}
	return render(request, 'theroasters.html', context)

def contact(request):
	contact_points = Contact.objects.all()
	context = {'contact_points' : contact_points}
	return render(request, 'contact.html', context)

