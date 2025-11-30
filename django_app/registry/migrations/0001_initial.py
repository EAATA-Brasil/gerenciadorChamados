from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="EquipmentRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vci_serial", models.CharField(blank=True, max_length=100, verbose_name="Número de série VCI")),
                ("tablet_serial", models.CharField(blank=True, max_length=100, verbose_name="Número de série Tablet")),
                ("prog_serial", models.CharField(blank=True, max_length=100, verbose_name="Número de série Prog")),
                ("client_name", models.CharField(max_length=150, verbose_name="Cliente")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="Email")),
                ("phone", models.CharField(blank=True, max_length=50, verbose_name="Telefone")),
                ("request_text", models.TextField(blank=True, verbose_name="Pedido")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Registro de equipamento",
                "verbose_name_plural": "Registros de equipamento",
            },
        ),
        migrations.CreateModel(
            name="Photo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="records/photos/")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "record",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="photos",
                        to="registry.equipmentrecord",
                    ),
                ),
            ],
            options={
                "ordering": ["-uploaded_at"],
                "verbose_name": "Foto",
                "verbose_name_plural": "Fotos",
            },
        ),
    ]
