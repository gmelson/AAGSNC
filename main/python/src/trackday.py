'''
Created on Jun 24, 2013

@author: gmelson
'''
from google.appengine.ext import ndb

class Trackday(ndb.Model):
    jsondata = ndb.BlobProperty(required = True)
    lastUpdated = ndb.DateTimeProperty(required = False)
