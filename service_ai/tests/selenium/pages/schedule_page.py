from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class SchedulePage(BasePage):
    NEW_SCHEDULE_BUTTON = (By.CSS_SELECTOR, "button[data-testid='btn-new-schedule']")
    ROOM_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-room']")
    START_TIME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-start-time']")
    END_TIME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-end-time']")
    SAVE_BUTTON = (By.CSS_SELECTOR, "button[data-testid='btn-save-schedule']")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast-message']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "[data-testid='schedule-error']")
    DELETE_BUTTONS = (By.CSS_SELECTOR, "button[data-testid^='btn-delete-schedule']")

    def load(self):
        self.open_url("/admin/schedules")

    def click_new_schedule(self):
        self.click_element(self.NEW_SCHEDULE_BUTTON)

    def fill_schedule_form(self, room, start_time, end_time):
        if room: self.enter_text(self.ROOM_INPUT, room)
        if start_time: self.enter_text(self.START_TIME_INPUT, start_time)
        if end_time: self.enter_text(self.END_TIME_INPUT, end_time)
            
    def submit_form(self):
        self.click_element(self.SAVE_BUTTON)

    def delete_first_schedule(self):
        self.click_element(self.DELETE_BUTTONS)

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)

    def get_error_message(self):
        return self.get_text(self.ERROR_MESSAGE)
