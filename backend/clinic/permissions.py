from rest_framework.permissions import BasePermission,SAFE_METHODS
def user_role(user):
    if not user or not user.is_authenticated: return None
    g=user.groups.first()
    return g.name.lower() if g else ('admin' if user.is_superuser else None)

class IsAdmin(BasePermission):
    def has_permission(self,request,view): return user_role(request.user)=='admin'

class RoleGate(BasePermission):
    def has_permission(self,request,view):
        role=user_role(request.user)
        if not role: return False
        if role=='admin': return True
        action=getattr(view,'action',None)
        ar=getattr(view,'action_roles',{})
        if action and action in ar: return role in ar[action]
        if request.method in SAFE_METHODS: allowed=getattr(view,'read_roles',None)
        elif request.method=='POST': allowed=getattr(view,'create_roles',None)
        elif request.method in ('PUT','PATCH'): allowed=getattr(view,'update_roles',None)
        elif request.method=='DELETE': allowed=getattr(view,'delete_roles',None)
        else: return False
        return True if allowed is None else role in allowed

class VisitObjectPermission(BasePermission):
    def has_object_permission(self,request,view,obj):
        role=user_role(request.user)
        if role=='admin': return True
        if request.method in SAFE_METHODS: return True
        if request.method in ('PUT','PATCH'):
            if role in ('nurse','doctor'): return obj.status=='awaiting_doctor'
            return False
        if request.method=='DELETE': return False
        return False
