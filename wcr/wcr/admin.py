from django.contrib import admin
from wcr.models import Product
from wcr.models import Catalog
from wcr.models import CatalogCategory
from wcr.models import ProductDetail
from wcr.models import ProductAttribute
from wcr.models import Blog
from wcr.models import Contact
from wcr.models import Faq

admin.site.register(Product)
admin.site.register(ProductDetail)
admin.site.register(ProductAttribute)
admin.site.register(Catalog)
admin.site.register(CatalogCategory)
admin.site.register(Blog)
admin.site.register(Contact)
admin.site.register(Faq)
