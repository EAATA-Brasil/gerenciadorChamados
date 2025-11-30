from django import forms
from .models import EquipmentRecord


class EquipmentRecordForm(forms.ModelForm):
    photos = forms.FileField(
        label="Fotos",
        widget=forms.ClearableFileInput(attrs={"multiple": True}),
        required=False,
        help_text="Adicione uma ou mais fotos do equipamento.",
    )

    class Meta:
        model = EquipmentRecord
        fields = [
            "vci_serial",
            "tablet_serial",
            "prog_serial",
            "client_name",
            "email",
            "phone",
            "request_text",
        ]
        labels = {
            "vci_serial": "Número série VCI",
            "tablet_serial": "Número série tablet",
            "prog_serial": "Número série prog",
            "client_name": "Cliente",
            "email": "Email",
            "phone": "Tel",
            "request_text": "Pedido",
        }
        widgets = {
            "request_text": forms.Textarea(attrs={"rows": 3}),
        }
