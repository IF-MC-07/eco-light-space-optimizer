from app.mqtt_subscriber import MQTTSubscriber


def test_on_connect_does_not_subscribe_to_energy_topics(monkeypatch):
    subscriber = MQTTSubscriber()
    subscribed = []

    def fake_subscribe(topic):
        subscribed.append(topic)

    monkeypatch.setattr(subscriber.client, "subscribe", fake_subscribe)

    subscriber._on_connect(subscriber.client, None, None, 0, None)

    assert "devices/+/energy" not in subscribed


def test_route_message_does_not_delegate_energy_payload(monkeypatch):
    subscriber = MQTTSubscriber()

    def fail_handler(*args, **kwargs):
        raise AssertionError("energy handler should not run")

    monkeypatch.setattr(subscriber, "_handle_energy", fail_handler)

    subscriber._route_message("devices/ROOM-1/energy", {"room_id": "ROOM-1"})
