import paho.mqtt.client as mqtt

def on_message(client, userdata, message):
    data = message.payload.decode()
    print(f"📩 Data diterima | Topic: {message.topic} | Data: {data}")

client = mqtt.Client()
client.on_message = on_message
client.connect('localhost', 1883)
client.subscribe('kelas/deteksi')

print("Menunggu data dari MQTT...")
client.loop_forever()