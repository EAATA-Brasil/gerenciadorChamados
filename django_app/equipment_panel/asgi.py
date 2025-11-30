import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from registry import routing as registry_routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "equipment_panel.settings")

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AuthMiddlewareStack(
            URLRouter(
                registry_routing.websocket_urlpatterns,
            )
        ),
    }
)
