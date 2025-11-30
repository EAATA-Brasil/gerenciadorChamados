from django.db import models


class EquipmentRecord(models.Model):
    vci_serial = models.CharField("Número de série VCI", max_length=100, blank=True)
    tablet_serial = models.CharField("Número de série Tablet", max_length=100, blank=True)
    prog_serial = models.CharField("Número de série Prog", max_length=100, blank=True)
    client_name = models.CharField("Cliente", max_length=150)
    email = models.EmailField("Email", blank=True)
    phone = models.CharField("Telefone", max_length=50, blank=True)
    request_text = models.TextField("Pedido", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Registro de equipamento"
        verbose_name_plural = "Registros de equipamento"

    def __str__(self) -> str:
        return f"{self.client_name} - {self.vci_serial or 'sem VCI'}"


class Photo(models.Model):
    record = models.ForeignKey(EquipmentRecord, related_name="photos", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="records/photos/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = "Foto"
        verbose_name_plural = "Fotos"

    def __str__(self) -> str:
        return f"Foto para {self.record_id}"
