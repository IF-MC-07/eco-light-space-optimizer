# Model comparison summary

## Folders
- pretrained_results: Hasil evaluasi model pra-latih (Set A).
- custom_results: Hasil evaluasi model finetuned pada dataset Anda (Set B).

## Key metrics
| Metric | pretrained_results (A) | custom_results (B) | Notes |
|---:|:---:|:---:|---|
| mAP@50 | 0.420 | 0.195 | from legend |
| F1 (max) | 0.49 @ conf≈0.271 | 0.26 @ conf≈0.162 | from F1-confidence plot |
| Precision (example) | ≈0.312 | N/A (~0.20–0.30) | example from confusion matrix (person vs background) |
| Recall (example) | ≈0.239 | 0.39 @ conf=0.0 | from legend / confusion |
| Accuracy | N/A | N/A | TN not available |
| Inference time | N/A | N/A | not provided |

## Recommendation
- Prefer `pretrained_results` (A) for accuracy (mAP & F1 higher).
- Tune detection confidence threshold ≈0.27 for A to maximize F1.
- Measure inference time on target hardware; if latency too high, consider smaller model or optimization.

## Notes
- Values sourced from plot legends and confusion matrices attached by user; some values are estimates when raw metrics files were not provided.
