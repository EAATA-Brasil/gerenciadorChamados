from django.contrib import admin
from .models import EquipmentRecord, Photo


class PhotoInline(admin.TabularInline):
    model = Photo
    extra = 1


@admin.register(EquipmentRecord)
class EquipmentRecordAdmin(admin.ModelAdmin):
    list_display = (
        "client_name",
        "vci_serial",
        "tablet_serial",
        "prog_serial",
        "email",
        "phone",
        "created_at",
    )
    search_fields = (
        "client_name",
        "vci_serial",
        "tablet_serial",
        "prog_serial",
        "email",
        "phone",
        "request_text",
    )
    inlines = [PhotoInline]


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("record", "image", "uploaded_at")
