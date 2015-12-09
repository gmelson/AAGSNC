import logging
import sys
import datetime
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from trackday import Trackday

class UpdatePage(webapp.RequestHandler):
                           
    def post(self):
        s = Trackday.query()
        for _s in s:
            _s.key.delete()

        trackday = Trackday(jsondata = self.request.body, lastUpdated=datetime.datetime.now())        
        trackday.put()
        

class MainPage(webapp.RequestHandler):
    
    def writeData(self, data):
        self.response.out.write(data)
        
    def get(self):
        clientupdated = self.request.get("lastupdated")
        self.response.headers['Content-Type'] = 'application/json'
        try:
            trackdays = Trackday.query()
            for trackday in trackdays:
                if trackday.lastUpdated:
                    self.response.out.write(trackday.lastUpdated)
                    if(trackday.lastUpdated > clientupdated) :
                        self.writeData(trackday.jsondata)
                        #self.response.out.write(trackday.jsondata)
                else:
                    self.writeData(trackday.jsondata)
        except Exception:
            e = sys.exc_info()[0]
            logging.info('error getting trackdays from db %s' % str(e))


application = webapp.WSGIApplication([('/', MainPage),('/update', UpdatePage)], debug=True)


def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
