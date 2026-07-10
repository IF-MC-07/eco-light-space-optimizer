from app import inference_realtime


class DummyDecisionEngine:
    def __init__(self):
        self.calls = []

    def process_inference(self, camera_id, occupancy_counts):
        self.calls.append((camera_id, occupancy_counts))


def test_maybe_process_decision_throttles_and_calls_engine():
    engine = DummyDecisionEngine()

    last_call = inference_realtime._maybe_process_decision(
        "cam-1",
        {"Zone A": 1, "total": 1},
        engine,
        last_decision_call=0.0,
        now=1.0,
        throttle_seconds=1.0,
    )

    assert engine.calls == [("cam-1", {"Zone A": 1, "total": 1})]
    assert last_call == 1.0

    second_last_call = inference_realtime._maybe_process_decision(
        "cam-1",
        {"Zone A": 2, "total": 2},
        engine,
        last_decision_call=1.0,
        now=1.5,
        throttle_seconds=1.0,
    )

    assert engine.calls == [("cam-1", {"Zone A": 1, "total": 1})]
    assert second_last_call == 1.0
