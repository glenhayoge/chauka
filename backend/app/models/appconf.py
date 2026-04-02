from sqlalchemy import Boolean, ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Settings(Base):
    __tablename__ = "appconf_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    logframe_id: Mapped[int] = mapped_column(Integer, ForeignKey("logframe_logframe.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(2048), default="")
    start_month: Mapped[int] = mapped_column(Integer, default=1)
    start_year: Mapped[int] = mapped_column(Integer, default=2013)
    end_year: Mapped[int] = mapped_column(Integer, default=2016)
    n_periods: Mapped[int] = mapped_column(Integer, default=1)
    currency: Mapped[str] = mapped_column(String(3), default="GBP")
    max_result_level: Mapped[int] = mapped_column(SmallInteger, default=3)
    open_result_level: Mapped[int] = mapped_column(SmallInteger, default=0)
    use_components: Mapped[bool] = mapped_column(Boolean, default=False)
