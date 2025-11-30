from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

from .forms import EquipmentRecordForm
from .models import EquipmentRecord, Photo


def serialize_record(record: EquipmentRecord) -> dict:
    return {
        "id": record.id,
        "client_name": record.client_name,
        "vci_serial": record.vci_serial,
        "tablet_serial": record.tablet_serial,
        "prog_serial": record.prog_serial,
        "email": record.email,
        "phone": record.phone,
        "request_text": record.request_text,
        "created_at": record.created_at.isoformat(),
        "photos": [photo.image.url for photo in record.photos.all()],
    }


@require_GET

def dashboard(request: HttpRequest):
    records = EquipmentRecord.objects.prefetch_related("photos").all()
    form = EquipmentRecordForm()
    return render(
        request,
        "registry/dashboard.html",
        {
            "form": form,
            "records": records,
        },
    )


@require_POST

def create_record(request: HttpRequest):
    form = EquipmentRecordForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)

    record = form.save()
    for uploaded in request.FILES.getlist("photos"):
        Photo.objects.create(record=record, image=uploaded)

    serialized = serialize_record(record)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "records", {"type": "record.created", "data": serialized}
    )
    return JsonResponse(serialized)
