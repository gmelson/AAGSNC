from datetime import datetime
from wcr.models import Bag
from wcr.models import Item

CART_ID = 'CART-ID'

class ItemAlreadyExists(Exception):
    pass

class ItemDoesNotExist(Exception):
    pass

class Cart:
    def __init__(self, request):
        bag_id = request.session.get(CART_ID)
        if bag_id:
            try:
                bag = Bag.objects.get(id=bag_id, checked_out=False)
            except Bag.DoesNotExist:
                bag = self.new(request)
        else:
            bag = self.new(request)
        self.bag = bag

    def __iter__(self):
        for item in self.bag.item_set.all():
            yield item

    def new(self, request):
        bag = Bag(creation_date=datetime.now())
        bag.save()
        request.session[CART_ID] = bag.id
        return bag

    def add(self, product, unit_price, quantity=1):
        try:
            item = Item.objects.get(
                bag=self.bag,
                product=product,
            )
        except Item.DoesNotExist:
            item = Item()
            item.bag = self.bag
            item.product = product
            item.unit_price = unit_price
            item.quantity = quantity
            item.save()
        else:
            item.quantity += 1
            item.save()

    def remove(self, product):
        try:
            item = Item.objects.get(
                bag=self.bag,
                product=product,
            )
        except Item.DoesNotExist:
            raise ItemDoesNotExist
        else:
            item.delete()

    def update(self, product, quantity, unit_price=None):
        try:
            item = Item.objects.get(
                bag=self.bag,
                product=product,
            )
        except Item.DoesNotExist:
            raise ItemDoesNotExist

    def clear(self):
        for item in self.bag.item_set.all():
            item.delete()

    def itemCount(self):
        total = 0
        for item in self.bag.item_set.all():
            total += item.quantity
        return total
