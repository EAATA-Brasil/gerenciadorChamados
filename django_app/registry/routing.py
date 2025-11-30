from django.urls import path
from . import consumers


websocket_urlpatterns = [
    path("ws/records/", consumers.RecordConsumer.as_asgi()),
]
