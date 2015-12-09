from django.db import models
from datetime import datetime
from django.utils.translation import ugettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

class Catalog(models.Model):
	name = models.CharField(max_length=255)
	slug = models.SlugField(max_length=150)
	publisher = models.CharField(max_length=300)
	description = models.TextField()
	pub_date = models.DateTimeField(default=datetime.now)

	def __unicode__(self):
		return u'%s' % (self.name)

class CatalogCategory(models.Model):
	catalog = models.ForeignKey('Catalog',related_name='categories')
	parent = models.ForeignKey('self', blank=True, null=True,related_name='children')
	name = models.CharField(max_length=300)
	slug = models.SlugField(max_length=150)
	description = models.TextField(blank=True)

	def __unicode__(self):
		if self.parent:
			return u'%s: %s - %s' % (self.catalog.name,self.parent.name,self.name)
		return u'%s: %s' % (self.catalog.name, self.name)

class Blog(models.Model):
    title = models.CharField(max_length=500)
    contents = models.TextField()
    def __unicode__(self):
        return u'%s' % (self.title)

class Faq(models.Model):
    title = models.CharField(max_length=500)
    contents = models.TextField()
    def __unicode__(self):
        return u'%s' % (self.title)

class Product(models.Model):
	category = models.ForeignKey('CatalogCategory',
                            related_name='products')
	name = models.CharField(max_length=300)
	slug = models.SlugField(max_length=150)
	description = models.TextField()
	photo = models.ImageField(upload_to='product_photo',
                                           blank=True)
	manufacturer = models.CharField(max_length=300,
                                           blank=True)
	price_in_dollars = models.DecimalField(max_digits=6,
                                      decimal_places=2)
	def __unicode__(self):
		return u'%s' % (self.name)

class ProductDetail(models.Model):
	'''
 	The ``ProductDetail`` model represents information unique to a
 	specific product. This is a generic design that can be used
 	to extend the information contained in the ``Product`` model with
 	specific, extra details.
 	'''
 	product = models.ForeignKey('Product',related_name='details')
 	attribute = models.ForeignKey('ProductAttribute')
 	value = models.CharField(max_length=500)
 	description = models.TextField(blank=True)

	def __unicode__(self):
		return u'%s: %s - %s' % (self.product,self.attribute,self.value)

class ProductAttribute(models.Model):
	'''
	The "ProductAttribute" model represents a class of feature found
	across a set of products. It does not store any data values
	related to the attribute, but only describes what kind of a
	product feature we are trying to capture. Possible attributes
	include things such as materials, colors, sizes, and many, many
	more.
	'''
	name = models.CharField(max_length=300)
	description = models.TextField(blank=True)
	def __unicode__(self):
		return u'%s' % self.name

class Bag(models.Model):
    creation_date = models.DateTimeField(verbose_name=_('creation date'))
    checked_out = models.BooleanField(default=False, verbose_name=_('checked out'))

    class Meta:
        verbose_name = _('bag')
        verbose_name_plural = _('bags')
        ordering = ('-creation_date',)

    def __unicode__(self):
        return unicode(self.creation_date)

class ItemManager(models.Manager):
    def get(self, *args, **kwargs):
        if 'product' in kwargs:
            kwargs['content_type'] = ContentType.objects.get_for_model(type(kwargs['product']))
            kwargs['object_id'] = kwargs['product'].pk
            del(kwargs['product'])
        return super(ItemManager, self).get(*args, **kwargs)

class Item(models.Model):
    bag = models.ForeignKey(Bag, verbose_name=_('bag'))
    quantity = models.PositiveIntegerField(verbose_name=_('quantity'))
    unit_price = models.DecimalField(max_digits=18, decimal_places=2, verbose_name=_('unit price'))
    # product as generic relation
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()

    objects = ItemManager()

    class Meta:
        verbose_name = _('item')
        verbose_name_plural = _('items')
        ordering = ('bag',)

    def __unicode__(self):
        return u''

    def total_price(self):
        return self.quantity * self.unit_price
    total_price = property(total_price)

    # product
    def get_product(self):
        return self.content_type.get_object_for_this_type(id=self.object_id)

    def set_product(self, product):
        self.content_type = ContentType.objects.get_for_model(type(product))
        self.object_id = product.pk

    product = property(get_product, set_product)

class Contact(models.Model):
    name = models.CharField(max_length=300)
    paragraph = models.TextField()
    photo = models.ImageField(upload_to='contact_photo',
                                           blank=True)
    def __unicode__(self):
        return u'%s' % (self.name)

