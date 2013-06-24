import logging
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import urlfetch

from proxy import Proxy
from schedule import Schedule

class UpdatePage(webapp.RequestHandler):
                
    def get(self):
        proxy = None
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Update successful!')
        json = self.request.get('json')
        logging.info('full url of proxied server ' + self.request.url)
        ip = self.request.remote_addr
        p = Proxy.query()
        for _p in p:
            if _p.proxiedip == ip:
                proxy = _p
                break            
        if not proxy:
            proxy = Proxy(proxiedip = ip)
            proxy.put()

class PushData(webapp.RequestHandler):
    def post(self):
        #jsondata = self.request.get('jsondata')
        s = Schedule.query()
        for _s in s:
            if _s.name == 'GAM':
                schedule = _s
                break            
        if not schedule:
            schedule = Schedule(name = 'GAM')
        schedule.jsondata = jsondata    
        schedule.put()
        

class MainPage(webapp.RequestHandler):
    
    def getProxiedTracks(self):
        proxies = Proxy.query()
        for proxy in proxies: 
            try:
                url = 'http://' + proxy.proxiedip + ':8180/gettracks'
                logging.info('url to fetch ' + url)
                result = urlfetch.fetch(url)
                logging.info('result from proxied server ' + result)
                self.response.out.write(result.content)        
            except Exception:
                logging.info('error trying to request ' + url)
                continue
        
                
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        schedules = Schedule.query()
        for schedule in schedules :
            try:
                self.response.out.write(schedule.jsondata)
            except Exception:
                logging.info('error getting schedule from db')
                continue


application = webapp.WSGIApplication([('/', MainPage),('/update', UpdatePage), ('/push'), PushData], debug=True)


def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
