from django.contrib.auth import authenticate
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
def _payload(u):
    g=u.groups.first()
    return {'id':u.id,'username':u.username,'name':u.get_full_name() or u.username,
            'role':g.name.lower() if g else 'admin'}
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    u=authenticate(username=(request.data.get('username') or '').strip(),
                   password=request.data.get('password') or '')
    if not u: return Response({'error':'Invalid credentials'},status=401)
    if not u.is_active: return Response({'error':'Account disabled'},status=403)
    r=RefreshToken.for_user(u)
    return Response({'access':str(r.access_token),'refresh':str(r),'user':_payload(u)})
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    token=request.data.get('refresh')
    if not token: return Response({'error':'Missing refresh token'},status=400)
    try: r=RefreshToken(token)
    except Exception: return Response({'error':'Invalid refresh token'},status=401)
    return Response({'access':str(r.access_token),'refresh':str(r)})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request): return Response(_payload(request.user))
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request): return Response({'ok':True})
