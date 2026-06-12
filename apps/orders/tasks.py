# apps/orders/tasks.py
from celery import shared_task
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=10,
    retry_kwargs={'max_retries': 3},
    retry_jitter=True,
)
def process_sales_order_shipping(self, order_id, user_id):
    from apps.orders.models import SaleOrder, OrderStatusHistory

    try:
        with transaction.atomic():
            order = (
                SaleOrder.objects
                .select_for_update()
                .select_related("warehouse", "customer")
                .get(id=order_id)
            )

            if order.status != "confirmed":
                return "already_processed"

            old_status = order.status

            # SaleOrder.ship() handles stock deduction + LowStockAlert creation
            # atomically with select_for_update(). Do not repeat that logic here.
            order.ship()

            OrderStatusHistory.objects.create(
                order_type="sale",
                order_id=order.id,
                old_status=old_status,
                new_status=order.status,
                changed_by_id=user_id,
                changed_at=timezone.now(),
            )

            return "shipped"

    except SaleOrder.DoesNotExist:
        return "not_found"

    except ValidationError as e:
        # FIX: previously cancelled the order silently with no audit trail.
        # Now we record the cancellation in OrderStatusHistory so it's
        # visible in the admin and API — critical for debugging and ops.
        with transaction.atomic():
            try:
                from apps.orders.models import OrderStatusHistory
                order = SaleOrder.objects.select_for_update().get(id=order_id)
                old = order.status
                order.status = "cancelled"
                order.save(update_fields=["status"])
                OrderStatusHistory.objects.create(
                    order_type="sale",
                    order_id=order.id,
                    old_status=old,
                    new_status="cancelled",
                    changed_by_id=user_id,
                    changed_at=timezone.now(),
                )
            except Exception:
                pass
        raise

    except Exception:
        raise


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 10},
)
def process_purchase_order_receiving(self, order_id, user_id):
    from apps.orders.models import PurchaseOrder, OrderStatusHistory
    from apps.accounts.models import CustomUser

    with transaction.atomic():
        order = (
            PurchaseOrder.objects
            .select_for_update()
            .select_related("supplier", "warehouse")
            .get(id=order_id)
        )

        if order.status != "confirmed":
            return "already_processed"

        user = CustomUser.objects.get(id=user_id)

        # FIX: The original task manually looped over items and added stock,
        # duplicating the logic inside PurchaseOrder.receive(). That caused
        # double stock addition when both paths ran. Now we delegate entirely
        # to the model method which owns this responsibility.
        # receive() sets status = "received" and saves internally.
        order.receive()

        OrderStatusHistory.objects.create(
            order_type="purchase",
            order_id=order.id,
            old_status="confirmed",
            new_status="received",
            changed_by=user,
        )

        return "received"