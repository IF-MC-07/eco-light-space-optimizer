import paho.mqtt.client as mqtt
import json

def on_message(client, userdata, message):
    data = json.loads(message.payload.decode())
    print(f"📩 Atas: {data['zona_atas']} | "
          f"Tengah: {data['zona_tengah']} | "
          f"Bawah: {data['zona_bawah']} | "
          f"Total: {data['total']} | "
          f"Lampu: {data['lampu']}")

client = mqtt.Client()
client.on_message = on_message
client.connect('localhost', 1883)
client.subscribe('kelas/deteksi')

print("✅ Menunggu data MQTT...")
client.loop_forever()