import logging
import datetime
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from trackday import Trackday

class UpdatePage(webapp.RequestHandler):
                           
    def post(self):
        s = Trackday.query()
        for _s in s:
            _s.key.delete()
        trackday = Trackday(jsondata = self.request.body)
        lastupdated = datetime.datetime.now()
        trackday.put()
        

class MainPage(webapp.RequestHandler):
    
                
    def get(self):

        clientupdated = self.request.get("lastupdated")
        self.response.headers['Content-Type'] = 'application/json'
        try:
            trackdays = Trackday.query()
            for trackday in trackdays:
                self.response.out.write(trackday.lastupdated)
                if(trackday.lastupdated > clientupdated) :
                    self.response.out.write(trackday.jsondata)
        except Exception:
            logging.info('error getting trackdays from db')


application = webapp.WSGIApplication([('/', MainPage),('/update', UpdatePage)], debug=True)


def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
