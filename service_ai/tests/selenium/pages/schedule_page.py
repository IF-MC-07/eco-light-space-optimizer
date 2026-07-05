from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage

class SchedulePage(BasePage):
    NEW_SCHEDULE_BUTTON = (By.XPATH, "//span[contains(text(), 'Add New Rule')]/..")
    NAME_INPUT = (By.XPATH, "//label[contains(text(), 'Schedule Name')]/following-sibling::input")
    START_TIME_INPUT = (By.XPATH, "//label[contains(text(), 'Start Time')]/following-sibling::div/input")
    END_TIME_INPUT = (By.XPATH, "//label[contains(text(), 'End Time')]/following-sibling::div/input")
    ROOM_SELECT = (By.XPATH, "//label[contains(text(), 'Select Room')]/following-sibling::select")
    SAVE_BUTTON = (By.XPATH, "//button[contains(text(), 'Schedule')]")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "ol[data-sonner-toaster] li")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "p.text-red-500, div.text-red-500")
    DELETE_BUTTONS = (By.XPATH, "//button[contains(@class, 'text-red-500')]") # Fallback for delete

    def load(self):
        self.open_url("/automation")

    def click_new_schedule(self):
        self.click_element(self.NEW_SCHEDULE_BUTTON)

    def fill_schedule_form(self, room, start_time, end_time):
        self.enter_text(self.NAME_INPUT, "Test Schedule")
        if room:
            from selenium.webdriver.support.ui import Select
            select = Select(self.find_element(self.ROOM_SELECT))
            select.select_by_visible_text(room)
        if start_time: self.enter_text(self.START_TIME_INPUT, start_time)
        if end_time: self.enter_text(self.END_TIME_INPUT, end_time)
            
    def submit_form(self):
        self.click_element(self.SAVE_BUTTON)

    def delete_first_schedule(self):
        # Depending on where the delete button is, this might fail if not found
        self.click_element(self.DELETE_BUTTONS)

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)

    def get_error_message(self):
        return self.get_text(self.ERROR_MESSAGE)
