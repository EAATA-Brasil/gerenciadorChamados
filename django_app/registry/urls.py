from django.urls import path
from . import views


app_name = "registry"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("records/create/", views.create_record, name="create_record"),
]
