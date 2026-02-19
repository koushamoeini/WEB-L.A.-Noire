from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Evidence, WitnessTestimony, BiologicalEvidence, VehicleEvidence, IdentificationDocument, OtherEvidence
from accounts.models import Notification, Role
from django.contrib.auth import get_user_model

@receiver(post_save, sender=WitnessTestimony)
@receiver(post_save, sender=BiologicalEvidence)
@receiver(post_save, sender=VehicleEvidence)
@receiver(post_save, sender=IdentificationDocument)
@receiver(post_save, sender=OtherEvidence)
def notify_detectives_on_new_evidence(sender, instance, created, **kwargs):
    if created:
        User = get_user_model()
        # Find all users with roles detective, officer, etc.
        detective_roles = ['detective', 'police_officer', 'patrol_officer', 'sergeant', 'captain', 'police_chief']
        detectives = User.objects.filter(roles__code__in=detective_roles).distinct()
        
        # We can also filter for detectives involved in this case if such mapping existed.
        # For now, we notify all eligible detectives about the new evidence.
        
        title = f"مدرک جدید: {instance.title}"
        message = f"یک مدرک جدید در پرونده #{instance.case.id} ثبت شد: {instance.description[:100]}..."
        link = f"/cases/{instance.case.id}"
        
        for detective in detectives:
            # Don't notify the person who just recorded it
            if detective != instance.recorder:
                Notification.objects.create(
                    user=detective,
                    title=title,
                    message=message,
                    link=link
                )
