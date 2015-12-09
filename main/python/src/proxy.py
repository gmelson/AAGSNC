'''
Created on Jun 11, 2013

@author: gmelson
'''
from google.appengine.ext import ndb

class Proxy(ndb.Model):
    proxiedip = ndb.StringProperty(required=True)
    