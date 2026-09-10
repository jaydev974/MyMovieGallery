from __future__ import annotations

import threading
import time
from collections import defaultdict
from dataclasses import dataclass, field

_REQUEST_LATENCY_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
_DB_LATENCY_BUCKETS = (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)
_START_TIME = time.time()
_LOCK = threading.Lock()


@dataclass
class _HistogramSeries:
    buckets: list[int] = field(default_factory=list)
    count: int = 0
    total: float = 0.0


_COUNTERS: dict[str, dict[tuple[tuple[str, str], ...], int]] = defaultdict(lambda: defaultdict(int))
_HISTOGRAMS: dict[str, dict[tuple[tuple[str, str], ...], _HistogramSeries]] = defaultdict(
    lambda: defaultdict(_HistogramSeries)
)


def _labels_key(labels: dict[str, str] | None) -> tuple[tuple[str, str], ...]:
    if not labels:
        return ()
    return tuple(sorted((str(key), str(value)) for key, value in labels.items()))


def _format_labels(labels: tuple[tuple[str, str], ...]) -> str:
    if not labels:
        return ""
    parts = [f'{key}="{value.replace("\\", "\\\\").replace("\"", "\\\"")}"' for key, value in labels]
    return "{" + ",".join(parts) + "}"


def _observe_histogram(name: str, buckets: tuple[float, ...], value: float, labels: dict[str, str] | None = None) -> None:
    key = _labels_key(labels)
    with _LOCK:
        series = _HISTOGRAMS[name][key]
        if not series.buckets:
            series.buckets = [0 for _ in buckets]
        series.count += 1
        series.total += value
        for index, bucket in enumerate(buckets):
            if value <= bucket:
                series.buckets[index] += 1


def increment_counter(name: str, labels: dict[str, str] | None = None, amount: int = 1) -> None:
    key = _labels_key(labels)
    with _LOCK:
        _COUNTERS[name][key] += amount


def record_http_request(method: str, path: str, status_code: int, duration_seconds: float) -> None:
    labels = {"method": method, "path": path, "status_code": str(status_code)}
    increment_counter("mymoviegallery_http_requests_total", labels)
    _observe_histogram("mymoviegallery_http_request_duration_seconds", _REQUEST_LATENCY_BUCKETS, duration_seconds, labels)


def record_db_query(operation: str, duration_seconds: float, success: bool = True) -> None:
    labels = {"operation": operation, "success": str(success).lower()}
    increment_counter("mymoviegallery_db_queries_total", labels)
    _observe_histogram("mymoviegallery_db_query_duration_seconds", _DB_LATENCY_BUCKETS, duration_seconds, labels)


def render_prometheus_metrics() -> str:
    lines: list[str] = []
    with _LOCK:
        uptime_seconds = time.time() - _START_TIME
        lines.extend(
            [
                "# HELP mymoviegallery_app_uptime_seconds Application uptime in seconds.",
                "# TYPE mymoviegallery_app_uptime_seconds gauge",
                f"mymoviegallery_app_uptime_seconds {uptime_seconds:.3f}",
            ]
        )

        for metric_name, series_map in _COUNTERS.items():
            help_name = metric_name.replace("_total", "").replace("mymoviegallery_", "")
            lines.append(f"# HELP {metric_name} {help_name.replace('_', ' ')}.")
            lines.append(f"# TYPE {metric_name} counter")
            for labels, value in series_map.items():
                lines.append(f"{metric_name}{_format_labels(labels)} {value}")

        histogram_buckets = {
            "mymoviegallery_http_request_duration_seconds": _REQUEST_LATENCY_BUCKETS,
            "mymoviegallery_db_query_duration_seconds": _DB_LATENCY_BUCKETS,
        }
        for metric_name, series_map in _HISTOGRAMS.items():
            lines.append(f"# HELP {metric_name} Request duration histogram.")
            lines.append(f"# TYPE {metric_name} histogram")
            for labels, series in series_map.items():
                buckets = histogram_buckets[metric_name]
                cumulative = 0
                for bucket_value, count in zip(buckets, series.buckets, strict=True):
                    cumulative += count
                    bucket_labels = labels + (("le", str(bucket_value)),)
                    lines.append(f"{metric_name}_bucket{_format_labels(bucket_labels)} {cumulative}")
                bucket_labels = labels + (("le", "+Inf"),)
                lines.append(f"{metric_name}_bucket{_format_labels(bucket_labels)} {series.count}")
                lines.append(f"{metric_name}_count{_format_labels(labels)} {series.count}")
                lines.append(f"{metric_name}_sum{_format_labels(labels)} {series.total:.6f}")

    return "\n".join(lines) + "\n"
