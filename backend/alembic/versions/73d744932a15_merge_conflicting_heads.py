"""merge conflicting heads

Revision ID: 73d744932a15
Revises: 23eab9a974b4, 33f9835e28ef
Create Date: 2026-08-26 17:28:08.603256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73d744932a15'
down_revision: Union[str, Sequence[str], None] = ('23eab9a974b4', '33f9835e28ef')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
