from django import forms
from django.contrib import admin
from django.contrib.admin import SimpleListFilter

from .models import (
	Evidence,
	EvidenceImage,
	WitnessTestimony,
	BiologicalEvidence,
	VehicleEvidence,
	IdentificationDocument,
	OtherEvidence,
)


EVIDENCE_KIND_CHOICES = (
	('witness', 'استشهاد شاهدان یا افراد محلی'),
	('biological', 'زیستی و پزشکی'),
	('vehicle', 'وسایل نقلیه'),
	('id-document', 'مدارک شناسایی'),
	('other', 'سایر موارد'),
)


def detect_kind(instance: Evidence) -> str:
	if hasattr(instance, 'witnesstestimony'):
		return 'witness'
	if hasattr(instance, 'biologicalevidence'):
		return 'biological'
	if hasattr(instance, 'vehicleevidence'):
		return 'vehicle'
	if hasattr(instance, 'identificationdocument'):
		return 'id-document'
	if hasattr(instance, 'otherevidence'):
		return 'other'
	return 'other'


class EvidenceTypeFilter(SimpleListFilter):
	title = 'نوع'
	parameter_name = 'kind'

	def lookups(self, request, model_admin):
		return EVIDENCE_KIND_CHOICES

	def queryset(self, request, queryset):
		value = self.value()
		if value == 'witness':
			return queryset.filter(witnesstestimony__isnull=False)
		if value == 'biological':
			return queryset.filter(biologicalevidence__isnull=False)
		if value == 'vehicle':
			return queryset.filter(vehicleevidence__isnull=False)
		if value == 'id-document':
			return queryset.filter(identificationdocument__isnull=False)
		if value == 'other':
			return queryset.filter(otherevidence__isnull=False)
		return queryset


class EvidenceForm(forms.ModelForm):
	kind = forms.ChoiceField(choices=(('', 'انتخاب نوع شاهد'),) + EVIDENCE_KIND_CHOICES)

	transcript = forms.CharField(required=False, widget=forms.Textarea)
	media = forms.FileField(required=False)

	is_verified = forms.BooleanField(required=False)
	medical_follow_up = forms.CharField(required=False, widget=forms.Textarea)
	database_follow_up = forms.CharField(required=False, widget=forms.Textarea)

	model_name = forms.CharField(required=False)
	color = forms.CharField(required=False)
	license_plate = forms.CharField(required=False)
	serial_number = forms.CharField(required=False)

	owner_full_name = forms.CharField(required=False)
	extra_info = forms.JSONField(required=False)

	class Meta:
		model = Evidence
		fields = ['case', 'title', 'description', 'recorder', 'kind']

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

		instance = getattr(self, 'instance', None)
		if instance and getattr(instance, 'pk', None):
			kind = detect_kind(instance)
			self.fields['kind'].initial = kind
			self.fields['kind'].disabled = True

			if kind == 'witness' and hasattr(instance, 'witnesstestimony'):
				child = instance.witnesstestimony
				self.fields['transcript'].initial = child.transcript
				self.fields['media'].initial = child.media

			if kind == 'biological' and hasattr(instance, 'biologicalevidence'):
				child = instance.biologicalevidence
				self.fields['is_verified'].initial = child.is_verified
				self.fields['medical_follow_up'].initial = child.medical_follow_up
				self.fields['database_follow_up'].initial = child.database_follow_up

			if kind == 'vehicle' and hasattr(instance, 'vehicleevidence'):
				child = instance.vehicleevidence
				self.fields['model_name'].initial = child.model_name
				self.fields['color'].initial = child.color
				self.fields['license_plate'].initial = child.license_plate
				self.fields['serial_number'].initial = child.serial_number

			if kind == 'id-document' and hasattr(instance, 'identificationdocument'):
				child = instance.identificationdocument
				self.fields['owner_full_name'].initial = child.owner_full_name
				self.fields['extra_info'].initial = child.extra_info

	def clean(self):
		cleaned = super().clean()
		instance = getattr(self, 'instance', None)
		kind = cleaned.get('kind')

		if instance and getattr(instance, 'pk', None):
			kind = detect_kind(instance)

		if not kind:
			raise forms.ValidationError('نوع شاهد را انتخاب کنید.')

		if kind == 'witness':
			if not (cleaned.get('transcript') or '').strip():
				self.add_error('transcript', 'رونوشت صحبت‌ها الزامی است.')

		if kind == 'vehicle':
			lp = (cleaned.get('license_plate') or '').strip()
			sn = (cleaned.get('serial_number') or '').strip()
			if bool(lp) == bool(sn):
				raise forms.ValidationError('برای وسیله نقلیه: دقیقاً یکی از شماره پلاک یا شماره سریال را وارد کنید.')

		if kind == 'id-document':
			if not (cleaned.get('owner_full_name') or '').strip():
				self.add_error('owner_full_name', 'نام کامل صاحب مدرک الزامی است.')

		return cleaned

	def save(self, commit=True):
		instance = getattr(self, 'instance', None)
		is_update = bool(instance and getattr(instance, 'pk', None))
		kind = detect_kind(instance) if is_update else self.cleaned_data.get('kind')

		base = super().save(commit=commit)
		if not commit:
			return base

		# Ensure subtype row exists and update subtype fields.
		if kind == 'witness':
			child = getattr(base, 'witnesstestimony', None)
			if child is None:
				child = WitnessTestimony.objects.create(
					evidence_ptr=base,
					transcript=self.cleaned_data.get('transcript', ''),
					media=self.cleaned_data.get('media'),
				)
			else:
				child.transcript = self.cleaned_data.get('transcript', '')
				if self.cleaned_data.get('media'):
					child.media = self.cleaned_data.get('media')
				child.save()

		elif kind == 'biological':
			child = getattr(base, 'biologicalevidence', None)
			if child is None:
				child = BiologicalEvidence.objects.create(
					evidence_ptr=base,
					is_verified=bool(self.cleaned_data.get('is_verified')),
					medical_follow_up=self.cleaned_data.get('medical_follow_up') or None,
					database_follow_up=self.cleaned_data.get('database_follow_up') or None,
				)
			else:
				child.is_verified = bool(self.cleaned_data.get('is_verified'))
				child.medical_follow_up = self.cleaned_data.get('medical_follow_up') or None
				child.database_follow_up = self.cleaned_data.get('database_follow_up') or None
				child.save()

		elif kind == 'vehicle':
			child = getattr(base, 'vehicleevidence', None)
			if child is None:
				child = VehicleEvidence.objects.create(
					evidence_ptr=base,
					model_name=self.cleaned_data.get('model_name', ''),
					color=self.cleaned_data.get('color', ''),
					license_plate=(self.cleaned_data.get('license_plate') or None),
					serial_number=(self.cleaned_data.get('serial_number') or None),
				)
			else:
				child.model_name = self.cleaned_data.get('model_name', '')
				child.color = self.cleaned_data.get('color', '')
				child.license_plate = self.cleaned_data.get('license_plate') or None
				child.serial_number = self.cleaned_data.get('serial_number') or None
				child.save()

		elif kind == 'id-document':
			child = getattr(base, 'identificationdocument', None)
			if child is None:
				child = IdentificationDocument.objects.create(
					evidence_ptr=base,
					owner_full_name=self.cleaned_data.get('owner_full_name', ''),
					extra_info=self.cleaned_data.get('extra_info') or {},
				)
			else:
				child.owner_full_name = self.cleaned_data.get('owner_full_name', '')
				child.extra_info = self.cleaned_data.get('extra_info') or {}
				child.save()

		else:
			child = getattr(base, 'otherevidence', None)
			if child is None:
				OtherEvidence.objects.create(evidence_ptr=base)

		return base


class EvidenceImageInline(admin.TabularInline):
	model = EvidenceImage
	extra = 0


@admin.register(Evidence)
class EvidenceUnifiedAdmin(admin.ModelAdmin):
	form = EvidenceForm
	list_display = ('id', 'case_id', 'title', 'evidence_kind', 'recorder', 'recorded_at')
	list_filter = (EvidenceTypeFilter, 'recorded_at')
	search_fields = ('title', 'description')
	ordering = ('id',)
	inlines = (EvidenceImageInline,)

	def evidence_kind(self, obj):
		kind = detect_kind(obj)
		return dict(EVIDENCE_KIND_CHOICES).get(kind, kind)

	evidence_kind.short_description = 'نوع'


# Hide per-type models from the admin index to keep a single “Evidence” section.
for _m in [
	WitnessTestimony,
	BiologicalEvidence,
	VehicleEvidence,
	IdentificationDocument,
	OtherEvidence,
]:
	try:
		admin.site.unregister(_m)
	except Exception:
		pass
