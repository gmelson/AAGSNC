from django.conf.urls import patterns, include, url

from django.contrib import admin
from django.conf import settings
from wcr import views

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	url(r'^admin/', include(admin.site.urls)),
    url(r'^$', views.index, name='index'),
    url(r'^product/(?P<product_id>\d+)/$', views.detail, name='detail'),
    url(r'^shop', views.shop, name='shop'),
    url(r'^about', views.about, name='about'),
    url(r'^blog', views.blog, name='blog'),
    url(r'^help', views.help, name='help'),
    url(r'^wholesale', views.wholesale, name='wholesale'),
    url(r'^contact', views.contact, name='contact'),
    url(r'^cart', views.cart, name='cart'),
    url(r'^theroasters', views.theroasters, name='theroasters'),
    url(r'^weekendsperfectcup', views.weekendsperfectcup, name='weekendsperfectcup'),
    url(r'^add_to_cart/(?P<product_id>\d+)/(?P<quantity>\d+)/$', views.add_to_cart, name='add_to_cart'),
    url(r'^clear_cart', views.clear_cart, name='clear_cart'),
    url(r'^remove_from_cart/(?P<product_id>\d+)/$', views.remove_from_cart, name='remove_from_cart'),
    url(r'^media/(?P<path>.*)$', 'django.views.static.serve',{'document_root': settings.MEDIA_ROOT}),
    (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
)
