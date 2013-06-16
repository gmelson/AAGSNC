from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.api import urlfetch

from proxy import Proxy

class UpdatePage(webapp.RequestHandler):
                
    def get(self):
        proxy = None
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Update successful!')

        ip = self.request.remote_addr;
        p = Proxy.query()
        for _p in p:
            if _p.proxiedip == ip:
                proxy = _p
                break            
        if not proxy:
            proxy = Proxy(proxiedip = ip)
            proxy.put()

class MainPage(webapp.RequestHandler):
    
                
    def get(self):
        self.response.headers['Content-Type'] = 'application/json'
        #self.response.out.write(redirectip)
        proxies = Proxy.query()
        for proxy in proxies: 
            try:
                result = urlfetch.fetch('http://' + proxy.proxiedip + '/gettracks')
                self.response.out.write(result.content)        
            except Exception:
                continue


application = webapp.WSGIApplication([('/', MainPage),('/update', UpdatePage)], debug=True)


def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
