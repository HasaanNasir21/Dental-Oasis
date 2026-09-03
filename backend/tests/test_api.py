from datetime import date, time, timedelta
from fastapi.testclient import TestClient


def test_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_public_appointment_create(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={
            "patient_name": "Ali Raza",
            "contact_number": "03001234567",
            "address": "Johar Town",
            "reason": "Checkup",
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["success"] is True
    assert "submitted successfully" in body["message"].lower()
    assert body["data"]["status"] == "PENDING"
    assert body["data"]["appointment_date"] is None


def test_invalid_appointment_name(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={"patient_name": "A", "contact_number": "03001234567", "reason": "Checkup"},
    )
    assert r.status_code == 422
    assert r.json()["success"] is False


def test_invalid_phone(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={"patient_name": "Ali Raza", "contact_number": "abc", "reason": "Checkup"},
    )
    assert r.status_code == 422


def test_missing_reason(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={"patient_name": "Ali Raza", "contact_number": "03001234567"},
    )
    assert r.status_code == 422


def test_other_problem_required(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={"patient_name": "Ali Raza", "contact_number": "03001234567", "reason": "Other"},
    )
    assert r.status_code == 422
    assert "describe your problem" in r.json()["message"].lower()


def test_other_problem_accepted(client: TestClient):
    r = client.post(
        "/api/appointments",
        json={
            "patient_name": "Ali Raza",
            "contact_number": "03001234567",
            "reason": "Other",
            "other_problem": "Sensitivity on the upper left side",
        },
    )
    assert r.status_code == 201


def test_duplicate_public_request(client: TestClient):
    payload = {
        "patient_name": "Ali Raza",
        "contact_number": "03009998888",
        "reason": "Braces",
    }
    first = client.post("/api/appointments", json=payload)
    second = client.post("/api/appointments", json=payload)
    assert first.status_code == 201
    assert second.status_code == 409


def test_public_cannot_list_clients(client: TestClient):
    r = client.get("/api/admin/clients")
    assert r.status_code == 401


def test_clinic_info_hides_secrets(client: TestClient):
    r = client.get("/api/clinic")
    assert r.status_code == 200
    data = r.json()["data"]
    assert "ADMIN_PASSWORD" not in str(data)
    assert "SECRET_KEY" not in str(data)
    assert data["name"] == "Dental Oasis"


def test_admin_login_success(client: TestClient):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "testpass123"})
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert "access_token" in r.cookies


def test_admin_login_invalid(client: TestClient):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid username or password."


def test_unauthorized_dashboard(client: TestClient):
    r = client.get("/api/admin/dashboard")
    assert r.status_code == 401


def test_me_after_login(admin_client: TestClient):
    r = admin_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["data"]["username"] == "admin"


def test_client_crud_and_search(admin_client: TestClient):
    created = admin_client.post(
        "/api/admin/clients",
        json={"name": "Muhammad Ali", "contact_number": "03001230000", "address": "Lahore"},
    )
    assert created.status_code == 201
    client_id = created.json()["data"]["id"]

    listed = admin_client.get("/api/admin/clients", params={"search": "Ali"})
    assert listed.status_code == 200
    assert listed.json()["meta"]["total"] == 1

    phone = admin_client.get("/api/admin/clients", params={"search": "0300"})
    assert phone.json()["meta"]["total"] == 1

    updated = admin_client.patch(f"/api/admin/clients/{client_id}", json={"address": "Johar Town"})
    assert updated.status_code == 200
    assert updated.json()["data"]["address"] == "Johar Town"

    deleted = admin_client.delete(f"/api/admin/clients/{client_id}")
    assert deleted.status_code == 200


def test_invalid_client_id(admin_client: TestClient):
    r = admin_client.get("/api/admin/clients/99999")
    assert r.status_code == 404


def test_invalid_appointment_id(admin_client: TestClient):
    r = admin_client.get("/api/admin/appointments/99999")
    assert r.status_code == 404


def _next_weekday() -> str:
    d = date.today()
    while d.weekday() == 6:
        d += timedelta(days=1)
    if d.weekday() == 6:
        d += timedelta(days=1)
    # if today is sunday already handled; if we need a future slot use today if weekday else monday
    return d.isoformat()


def _sunday() -> str:
    d = date.today()
    while d.weekday() != 6:
        d += timedelta(days=1)
    return d.isoformat()


def test_admin_appointment_and_conflict(admin_client: TestClient):
    client_res = admin_client.post(
        "/api/admin/clients",
        json={"name": "Ahmed Khan", "contact_number": "03111111111"},
    )
    client_id = client_res.json()["data"]["id"]
    day = _next_weekday()
    payload = {
        "patient_name": "Ahmed Khan",
        "contact_number": "03111111111",
        "reason": "Scaling & Polishing",
        "status": "CONFIRMED",
        "appointment_date": day,
        "appointment_time": "18:00:00",
    }
    first = admin_client.post(f"/api/admin/clients/{client_id}/appointments", json=payload)
    assert first.status_code == 201, first.text

    second = admin_client.post(f"/api/admin/clients/{client_id}/appointments", json=payload)
    assert second.status_code == 409
    assert "already occupied" in second.json()["message"].lower()


def test_sunday_appointment_rejected(admin_client: TestClient):
    client_res = admin_client.post(
        "/api/admin/clients",
        json={"name": "Test User", "contact_number": "03333333333"},
    )
    client_id = client_res.json()["data"]["id"]
    r = admin_client.post(
        f"/api/admin/clients/{client_id}/appointments",
        json={
            "patient_name": "Test User",
            "contact_number": "03333333333",
            "reason": "Checkup",
            "status": "CONFIRMED",
            "appointment_date": _sunday(),
            "appointment_time": "18:00:00",
        },
    )
    assert r.status_code == 422
    assert "sunday" in r.json()["message"].lower()


def test_outside_clinic_hours(admin_client: TestClient):
    client_res = admin_client.post(
        "/api/admin/clients",
        json={"name": "Hours Test", "contact_number": "03444444444"},
    )
    client_id = client_res.json()["data"]["id"]
    r = admin_client.post(
        f"/api/admin/clients/{client_id}/appointments",
        json={
            "patient_name": "Hours Test",
            "contact_number": "03444444444",
            "reason": "Checkup",
            "status": "CONFIRMED",
            "appointment_date": _next_weekday(),
            "appointment_time": "10:00:00",
        },
    )
    assert r.status_code == 422
    assert "clinic hours" in r.json()["message"].lower()


def test_confirm_and_cancel_flow(admin_client: TestClient):
    pending = admin_client.post(
        "/api/appointments",
        json={"patient_name": "Sara Malik", "contact_number": "03220000000", "reason": "Filling"},
    )
    appt_id = pending.json()["data"]["id"]
    day = _next_weekday()
    confirmed = admin_client.patch(
        f"/api/admin/appointments/{appt_id}",
        json={"status": "CONFIRMED", "appointment_date": day, "appointment_time": "19:00:00"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["data"]["status"] == "CONFIRMED"

    cancelled = admin_client.patch(
        f"/api/admin/appointments/{appt_id}",
        json={"status": "CANCELLED"},
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["data"]["status"] == "CANCELLED"


def test_pagination_and_filters(admin_client: TestClient):
    admin_client.post(
        "/api/appointments",
        json={"patient_name": "Filter One", "contact_number": "03550000001", "reason": "Checkup"},
    )
    r = admin_client.get("/api/admin/appointments", params={"page": 1, "page_size": 10, "status": "PENDING"})
    assert r.status_code == 200
    assert "meta" in r.json()
    assert r.json()["meta"]["page_size"] <= 100


def test_calendar_range(admin_client: TestClient):
    r = admin_client.get("/api/admin/calendar", params={"start_date": "2026-01-01", "end_date": "2026-01-31"})
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_settings_patch_does_not_expose_password(admin_client: TestClient):
    r = admin_client.patch("/api/admin/settings", json={"phone": "03001112222"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["phone"] == "03001112222"
    assert "password" not in r.json()["message"].lower()
    dumped = str(r.json())
    assert "testpass123" not in dumped
    assert "SECRET_KEY" not in dumped


def test_logout(admin_client: TestClient):
    r = admin_client.post("/api/auth/logout")
    assert r.status_code == 200
    me = admin_client.get("/api/auth/me")
    assert me.status_code == 401
