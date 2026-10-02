from pydantic import BaseModel
from datetime import datetime


class AppointmentFileOut(BaseModel):
    id: int
    appointment_id: int
    file_url: str
    file_type: str
    file_name: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}
