from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Suspect, Interrogation, InterrogationFeedback, BoardConnection, Board
from .serializers import (
    SuspectSerializer, InterrogationSerializer, 
    InterrogationFeedbackSerializer, BoardConnectionSerializer, BoardSerializer
)
from .permissions import IsCaptain, IsDetective
from cases.permissions import IsOfficerOrHigher

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated, IsDetective]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

class SuspectViewSet(viewsets.ModelViewSet):
    queryset = Suspect.objects.all()
    serializer_class = SuspectSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            print("DEBUG: Suspect create data:", request.data)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({
                'error': str(e),
                'detail': 'Internal Server Error during suspect creation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDetective])
    def toggle_board(self, request, pk=None):
        suspect = self.get_object()
        suspect.is_on_board = not suspect.is_on_board
        suspect.save()
        return Response({'is_on_board': suspect.is_on_board})

class InterrogationViewSet(viewsets.ModelViewSet):
    queryset = Interrogation.objects.all()
    serializer_class = InterrogationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOfficerOrHigher]

    def perform_create(self, serializer):
        serializer.save(interrogator=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsCaptain])
    def feedback(self, request, pk=None):
        interrogation = self.get_object()
        serializer = InterrogationFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(interrogation=interrogation, captain=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class BoardConnectionViewSet(viewsets.ModelViewSet):
    queryset = BoardConnection.objects.all()
    serializer_class = BoardConnectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDetective]

    def get_queryset(self):
        case_id = self.request.query_params.get('case')
        if case_id:
            return self.queryset.filter(case_id=case_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            print("DEBUG: BoardConnection create data:", request.data)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({
                'error': str(e),
                'detail': 'Internal Server Error during connection creation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
