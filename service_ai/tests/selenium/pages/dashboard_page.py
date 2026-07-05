from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage

class DashboardPage(BasePage):
    LIGHT_TOGGLE_ON = (By.CSS_SELECTOR, "table tbody tr button.w-11")
    LIGHT_TOGGLE_OFF = (By.CSS_SELECTOR, "table tbody tr button.w-11")
    AC_TEMP_SLIDER = (By.CSS_SELECTOR, "button.w-8")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "ol[data-sonner-toaster] li")

    def load(self):
        self.open_url("/lighting-ac")

    def toggle_light_on(self):
        self.click_element(self.LIGHT_TOGGLE_ON)

    def toggle_light_off(self):
        self.click_element(self.LIGHT_TOGGLE_OFF)

    def set_ac_temperature(self, temp: int):
        self.enter_text(self.AC_TEMP_SLIDER, str(temp))
        self.click_element((By.TAG_NAME, "body"))

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)
