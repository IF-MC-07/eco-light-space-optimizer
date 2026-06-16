import pytest
from tests.pages.schedule_page import SchedulePage

class TestSchedule:
    def test_tc_001_create_schedule_success(self, logged_in_admin):
        """TC-001: Berhasil membuat jadwal baru dengan data valid"""
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("A101", "08:00", "10:00")
        schedule_page.submit_form()
        toast = schedule_page.get_toast_message()
        assert "berhasil" in toast.lower() or "added" in toast.lower()

    def test_tc_002_create_schedule_fail_end_time_earlier(self, logged_in_admin):
        """TC-002: Gagal membuat jadwal karena jam selesai lebih awal"""
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("A101", "10:00", "08:00")
        schedule_page.submit_form()
        error = schedule_page.get_error_message()
        assert "lebih awal" in error.lower() or "before" in error.lower() or "invalid" in error.lower()

    def test_tc_003_delete_schedule_success(self, logged_in_admin, api_create_test_schedule):
        """TC-003: Berhasil menghapus jadwal"""
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.delete_first_schedule()
        toast = schedule_page.get_toast_message()
        assert "hapus" in toast.lower() or "deleted" in toast.lower()

    def test_tc_004_create_schedule_fail_empty_room(self, logged_in_admin):
        """TC-004: Gagal membuat jadwal karena field ruangan kosong"""
        schedule_page = SchedulePage(logged_in_admin)
        schedule_page.load()
        schedule_page.click_new_schedule()
        schedule_page.fill_schedule_form("", "08:00", "10:00")
        schedule_page.submit_form()
        error = schedule_page.get_error_message()
        assert "kosong" in error.lower() or "required" in error.lower() or "wajib" in error.lower()
