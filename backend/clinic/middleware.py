import logging,threading,time,uuid
_log=logging.getLogger('clinic.requests')
_thread=threading.local()
def get_request_id(): return getattr(_thread,'request_id',None)
def get_current_user(): return getattr(_thread,'user',None)
class RequestIDMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        rid=request.headers.get('X-Request-ID') or uuid.uuid4().hex[:12]
        _thread.request_id=rid; request.request_id=rid
        try: return self.get_response(request)
        finally: _thread.request_id=None
class CurrentUserMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        _thread.user=getattr(request,'user',None)
        try: return self.get_response(request)
        finally: _thread.user=None
class RequestLogMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        t0=time.monotonic()
        try: response=self.get_response(request); return response
        finally:
            dur=(time.monotonic()-t0)*1000
            _log.info('%s %s -> %s %.1fms user=%s',request.method,request.get_full_path(),
                getattr(response,'status_code','?'),dur,
                getattr(getattr(request,'user',None),'username','anon'))
