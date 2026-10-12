import logging
from rest_framework.views import exception_handler as drf
_log=logging.getLogger('clinic.errors')
def api_exception_handler(exc,context):
    response=drf(exc,context)
    if response is not None and response.status_code>=500:
        _log.exception('Unhandled in %s',context.get('view'))
    elif response is not None and response.status_code>=400:
        _log.warning('API %s: %s',response.status_code,response.data)
    return response
