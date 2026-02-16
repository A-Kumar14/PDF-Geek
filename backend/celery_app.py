"""Celery application factory with Flask app context support."""

import os

from celery import Celery, Task
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def make_celery(app=None):
    """Create a Celery instance that runs tasks inside the Flask app context."""

    class FlaskTask(Task):
        def __call__(self, *args, **kwargs):
            if app is not None:
                with app.app_context():
                    return self.run(*args, **kwargs)
            return self.run(*args, **kwargs)

    celery = Celery(
        "filegeek",
        broker=os.getenv("CELERY_BROKER_URL", REDIS_URL),
        backend=os.getenv("CELERY_RESULT_BACKEND", REDIS_URL),
        task_cls=FlaskTask,
    )

    celery.conf.update(
        accept_content=["json"],
        task_serializer="json",
        result_serializer="json",
        task_track_started=True,
        task_soft_time_limit=120,
        task_time_limit=180,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        broker_connection_retry_on_startup=True,
    )

    celery.autodiscover_tasks(["tasks"])

    return celery


# Module-level instance for: celery -A celery_app.celery_app worker
celery_app = make_celery()


def init_celery(app):
    """Attach Flask app context to an existing Celery instance."""
    celery_app.Task = type(
        "FlaskTask",
        (Task,),
        {"__call__": lambda self, *a, **kw: _run_in_context(app, self, *a, **kw)},
    )
    celery_app.conf.update(app.config.get("CELERY", {}))
    return celery_app


def _run_in_context(app, task, *args, **kwargs):
    with app.app_context():
        return task.run(*args, **kwargs)
