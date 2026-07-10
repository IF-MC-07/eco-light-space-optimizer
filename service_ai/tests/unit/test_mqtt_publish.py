import types

from app import mqtt_commands
from app.mqtt_subscriber import MQTTSubscriber


class DummyPublishClient:
    def __init__(self, rc=0):
        self.rc = rc
        self.calls = []

    def publish(self, topic, payload, qos=0):
        self.calls.append((topic, payload))
        return types.SimpleNamespace(rc=self.rc)


def test_send_light_command_uses_dict_payload(monkeypatch):
    dummy_client = DummyPublishClient()
    monkeypatch.setattr(mqtt_commands, "mqtt_client", dummy_client)

    commander = mqtt_commands.MQTTCommander()
    commander.send_light_command(
        room_id="ROOM-1",
        relay_channel=2,
        command="ON",
        zone_id=7,
        zone_name="Meeting",
        source="test",
    )

    assert dummy_client.calls[0][0] == "devices/ROOM-1/light/2"
    payload = dummy_client.calls[0][1]
    assert isinstance(payload, dict)
    assert payload["command"] == "ON"
    assert payload["zone_name"] == "Meeting"


def test_subscriber_publish_returns_false_on_publish_error(monkeypatch, caplog):
    subscriber = MQTTSubscriber.__new__(MQTTSubscriber)
    dummy_client = DummyPublishClient(rc=4)
    subscriber.client = dummy_client

    result = subscriber.publish("devices/ROOM-1/light/2", {"command": "ON"})

    assert result is False
    assert dummy_client.calls[0][1] == '{"command": "ON"}'
    assert "Failed to publish" in caplog.text
