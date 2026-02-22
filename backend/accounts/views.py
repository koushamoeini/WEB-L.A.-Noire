from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.generics import CreateAPIView

from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role, Notification
from .serializers import (
    RegistrationSerializer, RoleSerializer, UserRoleSerializer, 
    NotificationSerializer, AdminUserSerializer
)
from .serializers_user_read import UserReadSerializer
from rest_framework.generics import ListAPIView


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminUser(permissions.BasePermission):
    """Admin users: superuser or police_chief"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.roles.filter(code__in=['police_chief']).exists()


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperUser()]
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class UserRoleUpdate(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, user_pk):
        user_model = get_user_model()
        user = get_object_or_404(user_model, pk=user_pk)
        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.update(user, serializer.validated_data)
        return Response({'ok': True, 'roles': [r.name for r in user.roles.all()]})


class UserListView(ListAPIView):
    """List users (admin only) with their role ids."""
    permission_classes = [IsSuperUser]
    serializer_class = UserReadSerializer

    def get_queryset(self):
        return get_user_model().objects.all().order_by('id')


class UserStatsView(APIView):
    """Public endpoint for user statistics."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        user_model = get_user_model()
        total_users = user_model.objects.count()
        return Response({'total_users': total_users})


class SystemStatsView(APIView):
    """Provides public statistics for the system home page."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        from django.contrib.auth import get_user_model
        from cases.models import Case
        user_model = get_user_model()
        
        total_cases = Case.objects.count()
        solved_cases = Case.objects.filter(status=Case.Status.SOLVED).count()
        active_cases = Case.objects.filter(status=Case.Status.ACTIVE).count()
        total_users = user_model.objects.count()
        
        return Response({
            'total_cases': total_cases,
            'solved_cases': solved_cases,
            'active_cases': active_cases,
            'total_users': total_users,
        })


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        roles = []
        try:
            roles = list(user.roles.all().order_by('id').values('id', 'code', 'name'))
        except Exception:
            roles = []
        return Response(
            {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'is_superuser': bool(user.is_superuser),
                'roles': roles,
            }
        )


class RegisterView(CreateAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = []  # allow any
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        data = {
            'id': user.pk, 
            'username': user.username, 
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        return Response(data, status=status.HTTP_201_CREATED)


    def get(self, request, *args, **kwargs):
        # Redirect browser GETs to the HTML registration page for convenience
        return redirect('register')


class LoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        identifier = (request.data.get('identifier') or '').strip()
        password = request.data.get('password')
        if not identifier or not password:
            return Response({'detail': 'نام کاربری/کد ملی/شماره تماس/ایمیل و رمز عبور لازم است.'}, status=status.HTTP_400_BAD_REQUEST)
        user_model = get_user_model()
        user = (
            user_model.objects.filter(
                Q(username__iexact=identifier)
                | Q(email__iexact=identifier)
                | Q(profile__national_code=identifier)
                | Q(profile__phone=identifier)
            )
            .distinct()
            .first()
        )
        if not user or not user.check_password(password):
            return Response({'detail': 'اطلاعات ورود نامعتبر است.'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'id': user.pk, 
            'username': user.username, 
            'is_superuser': user.is_superuser
        })


    def get(self, request, *args, **kwargs):
        # Redirect browser GETs to the HTML login page for convenience
        return redirect('login')


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=self.request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        Notification.objects.filter(user=self.request.user).delete()
        return Response({'status': 'all notifications cleared'}, status=status.HTTP_204_NO_CONTENT)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin panel user management - full CRUD operations."""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'profile__phone', 'profile__national_code']
    ordering_fields = ['id', 'username', 'email', 'date_joined', 'last_login', 'is_active']
    ordering = ['-id']

    def get_queryset(self):
        queryset = get_user_model().objects.select_related('profile').prefetch_related('roles').all()
        
        # Filter by role
        role_code = self.request.query_params.get('role')
        if role_code:
            queryset = queryset.filter(roles__code=role_code)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by superuser status
        is_superuser = self.request.query_params.get('is_superuser')
        if is_superuser is not None:
            queryset = queryset.filter(is_superuser=is_superuser.lower() == 'true')
        
        return queryset.distinct()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add profile info
        try:
            profile = instance.profile
            data['phone'] = profile.phone
            data['national_code'] = profile.national_code
        except:
            data['phone'] = ''
            data['national_code'] = ''
        
        return Response(data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'id': user.id,
            'is_active': user.is_active,
            'message': f'کاربر {"فعال" if user.is_active else "غیرفعال"} شد.'
        })

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset user password to a default."""
        user = self.get_object()
        new_password = request.data.get('password', 'newpassword123')
        user.set_password(new_password)
        user.save()
        return Response({'message': 'رمز عبور با موفقیت تغییر کرد.'})


class AdminStatsView(APIView):
    """Comprehensive admin statistics."""
    permission_classes = [IsAdminUser]

    def get(self, request, *args, **kwargs):
        from cases.models import Case
        from evidence.models import Evidence
        from investigation.models import Suspect, Verdict
        
        User = get_user_model()
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = total_users - active_users
        superusers = User.objects.filter(is_superuser=True).count()
        
        # Users by role
        users_by_role = list(
            Role.objects.annotate(user_count=Count('users')).values('code', 'name', 'user_count')
        )
        
        # Case statistics
        from evidence.models import BiologicalEvidence
        
        total_cases = Case.objects.count()
        pending_cases = Case.objects.filter(
            status__in=[Case.Status.PENDING_TRAINEE, Case.Status.PENDING_OFFICER, Case.Status.PENDING_SERGEANT, Case.Status.PENDING_CHIEF]
        ).count()
        active_cases = Case.objects.filter(status__in=[Case.Status.ACTIVE, Case.Status.IN_PURSUIT]).count()
        solved_cases = Case.objects.filter(status=Case.Status.SOLVED).count()
        rejected_cases = Case.objects.filter(status__in=[Case.Status.REJECTED, Case.Status.CANCELLED]).count()
        
        # Evidence statistics (only BiologicalEvidence has is_verified field)
        total_evidence = Evidence.objects.count()
        verified_evidence = BiologicalEvidence.objects.filter(is_verified=True).count()
        pending_evidence = BiologicalEvidence.objects.filter(is_verified=False).count()
        
        # Investigation statistics
        total_suspects = Suspect.objects.count()
        arrested_suspects = Suspect.objects.filter(status=Suspect.Status.ARRESTED).count()
        free_suspects = Suspect.objects.filter(status=Suspect.Status.FREE).count()
        total_verdicts = Verdict.objects.count()
        guilty_verdicts = Verdict.objects.filter(result=Verdict.Result.GUILTY).count()
        innocent_verdicts = Verdict.objects.filter(result=Verdict.Result.INNOCENT).count()
        
        # Recent activity (last 5 items)
        recent_users = list(
            User.objects.order_by('-date_joined')[:5].values('id', 'username', 'email', 'date_joined')
        )
        recent_cases = list(
            Case.objects.order_by('-created_at')[:5].values('id', 'title', 'created_at', 'status')
        )
        recent_evidence = list(
            Evidence.objects.order_by('-recorded_at')[:5].values('id', 'title', 'recorded_at')
        )
        
        return Response({
            'users': {
                'total': total_users,
                'active': active_users,
                'inactive': inactive_users,
                'superusers': superusers,
                'by_role': users_by_role,
                'recent': recent_users,
            },
            'cases': {
                'total': total_cases,
                'pending': pending_cases,
                'active': active_cases,
                'solved': solved_cases,
                'rejected': rejected_cases,
                'recent': recent_cases,
            },
            'evidence': {
                'total': total_evidence,
                'verified': verified_evidence,
                'pending': pending_evidence,
                'recent': recent_evidence,
            },
            'investigation': {
                'suspects': total_suspects,
                'arrests': arrested_suspects,
                'verdicts': {
                    'total': total_verdicts,
                    'guilty': guilty_verdicts,
                    'innocent': innocent_verdicts,
                },
            }
        })
