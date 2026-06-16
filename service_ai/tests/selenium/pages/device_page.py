from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class DevicePage(BasePage):
    ADD_DEVICE_BTN = (By.CSS_SELECTOR, "button[data-testid='btn-add-device']")
    DEVICE_TYPE_SELECT = (By.CSS_SELECTOR, "select[data-testid='select-device-type']")
    NAME_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-device-name']")
    ZONE_SELECT = (By.CSS_SELECTOR, "select[data-testid='select-zone']")
    RELAY_CHANNEL_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-relay-channel']")
    IP_ADDRESS_INPUT = (By.CSS_SELECTOR, "input[data-testid='input-ip-address']")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[data-testid='btn-submit-device']")
    INLINE_ERROR = (By.CSS_SELECTOR, "[data-testid='inline-error']")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "[data-testid='toast-message']")

    def load(self):
        self.open_url("/admin/devices")

    def click_add_device(self):
        self.click_element(self.ADD_DEVICE_BTN)

    def select_device_type(self, dev_type):
        self.enter_text(self.DEVICE_TYPE_SELECT, dev_type)

    def fill_light_form(self, name, zone, relay_channel):
        self.enter_text(self.NAME_INPUT, name)
        self.enter_text(self.ZONE_SELECT, zone)
        self.enter_text(self.RELAY_CHANNEL_INPUT, str(relay_channel))

    def fill_camera_form(self, name, zone, ip_address):
        self.enter_text(self.NAME_INPUT, name)
        self.enter_text(self.ZONE_SELECT, zone)
        self.enter_text(self.IP_ADDRESS_INPUT, ip_address)

    def submit_form(self):
        self.click_element(self.SUBMIT_BTN)

    def get_inline_error(self):
        return self.get_text(self.INLINE_ERROR)

    def get_toast_message(self):
        return self.get_text(self.TOAST_MESSAGE)
