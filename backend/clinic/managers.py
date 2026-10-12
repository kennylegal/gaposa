from django.db import models
from django.utils import timezone
class SoftDeleteQuerySet(models.QuerySet):
    def alive(self): return self.filter(is_deleted=False)
    def dead(self): return self.filter(is_deleted=True)
    def delete(self): return super().update(is_deleted=True,deleted_at=timezone.now())
    def hard_delete(self): return super().delete()
    def restore(self): return super().update(is_deleted=False,deleted_at=None,deleted_by=None)
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model,using=self._db).filter(is_deleted=False)
class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model,using=self._db)
