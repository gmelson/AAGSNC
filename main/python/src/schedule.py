'''
Created on Jun 23, 2013

@author: gmelson
'''
from google.appengine.ext import ndb

class Schedule(ndb.Model):
        name = ndb.StringProperty(required=True)
        jsondata = ndb.StringProperty(required=False)
