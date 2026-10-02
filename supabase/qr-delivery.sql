-- Deliveries can only be confirmed by scanning the buyer's QR code.
--
-- Run once in the Supabase SQL editor, after pickup-window.sql.
--
-- Until now the owning business could mark an order completed with a plain UPDATE, which is
-- what the "Teslim Et" buttons and the typed pickup code did. Anyone holding a business token
-- could do the same through the API with no proof the buyer was there.
--
-- Now completing goes through complete_delivery(), which needs the order's secret qr_token,
-- shown only inside the buyer's own app. The function raises a transaction-local flag; the
-- transition trigger refuses `completed` unless that flag is set. The flag can only be set
-- from inside a function, and PostgREST exposes no way to call set_config directly.

create or replace function public.complete_delivery(qr text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.reservations%rowtype;
begin
  if public.auth_role() <> 'business' and public.auth_role() <> 'ngo' then
    raise exception 'Teslimat yalnızca işletme veya STK hesabıyla onaylanır.';
  end if;

  select * into target
    from public.reservations
   where qr_token = qr
     and organisation_id = public.auth_org();

  if target.id is null then
    raise exception 'Geçersiz QR kod.';
  end if;
  if target.status = 'completed' then
    raise exception 'Bu teslimat daha önce zaten onaylanmış.';
  end if;
  if target.status <> 'confirmed' then
    raise exception 'Bu sipariş artık teslim edilemez.';
  end if;

  perform set_config('app.delivery_qr_confirmed', '1', true);
  update public.reservations set status = 'completed' where id = target.id;
  perform set_config('app.delivery_qr_confirmed', '', true);

  return target.id;
end;
$$;

revoke all on function public.complete_delivery(text) from public;
revoke all on function public.complete_delivery(text) from anon;
grant execute on function public.complete_delivery(text) to authenticated;

-- Replaces the version in pickup-window.sql: same cancellation rule, but `completed` now
-- requires the QR flag set above.
create or replace function public.check_reservation_transition()
returns trigger language plpgsql as $$
declare
  cancel_deadline timestamptz;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' and old.user_id = auth.uid() then
    cancel_deadline := public.pickup_instant(old.created_at, old.pickup_start_time)
                       - interval '30 minutes';
    if cancel_deadline is not null and now() > cancel_deadline then
      raise exception 'Teslim saatine 30 dakikadan az kaldığı için iptal edilemez.';
    end if;
    return new;
  end if;

  if new.status = 'completed'
     and old.organisation_id = public.auth_org()
     and current_setting('app.delivery_qr_confirmed', true) = '1' then
    return new;
  end if;

  raise exception 'Bu durum değişikliği için yetkiniz yok: % -> %', old.status, new.status;
end;
$$;
