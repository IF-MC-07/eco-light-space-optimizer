from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage

class DevicePage(BasePage):
    ADD_DEVICE_BTN = (By.XPATH, "//button[contains(., 'Add Device')]")
    DEVICE_TYPE_SELECT = (By.XPATH, "//label[contains(text(), 'Device Type')]/following-sibling::div//select")
    NAME_INPUT = (By.XPATH, "//label[contains(text(), 'Device Name')]/following-sibling::input")
    ZONE_SELECT = (By.XPATH, "//label[contains(text(), 'Zone')]/following-sibling::div//select")
    RELAY_CHANNEL_INPUT = (By.XPATH, "//label[contains(text(), 'Relay Channel')]/following-sibling::input")
    IP_ADDRESS_INPUT = (By.XPATH, "//label[contains(text(), 'IP Address or Stream URL')]/following-sibling::input")
    RESOLUTION_SELECT = (By.XPATH, "//label[contains(text(), 'Resolution')]/following-sibling::div//select")
    # Submit button - find button with MonitorSpeaker icon and "Add Device" text
    SUBMIT_BTN = (By.XPATH, "//button[contains(., 'Add Device') and contains(@class, 'bg-primary')]")
    INLINE_ERROR = (By.CSS_SELECTOR, "p.text-red-500")
    TOAST_MESSAGE = (By.CSS_SELECTOR, "ol[data-sonner-toaster] li")

    def load(self):
        self.open_url("/rooms/1")

    def click_add_device(self):
        import time
        time.sleep(0.5)
        # Click the "+ Add Device" button (not the submit button in modal)
        btn = self.driver.find_element(By.XPATH, "//button[contains(., '+ Add Device')]")
        self.driver.execute_script("arguments[0].scrollIntoView(true);", btn)
        time.sleep(0.3)
        btn.click()
        time.sleep(1)

    def select_device_type(self, dev_type):
        from selenium.webdriver.support.ui import Select
        import time
        time.sleep(0.3)
        select = Select(self.find_element(self.DEVICE_TYPE_SELECT))
        select.select_by_value(dev_type)
        time.sleep(0.8)

    def fill_light_form(self, name, zone, relay_channel):
        import time
        time.sleep(0.3)
        self.enter_text(self.NAME_INPUT, name)
        time.sleep(0.3)
        from selenium.webdriver.support.ui import Select
        select = Select(self.find_element(self.ZONE_SELECT))
        select.select_by_visible_text(zone)
        time.sleep(0.3)
        self.enter_text(self.RELAY_CHANNEL_INPUT, str(relay_channel))
        time.sleep(0.3)

    def fill_camera_form(self, name, zone, ip_address):
        import time
        time.sleep(0.3)
        self.enter_text(self.NAME_INPUT, name)
        time.sleep(0.3)
        # Camera doesn't have zone field, only IP address
        self.enter_text(self.IP_ADDRESS_INPUT, ip_address)
        time.sleep(0.3)

    def submit_form(self):
        import time
        time.sleep(0.5)
        
        # Find all buttons with "Add Device" text
        add_device_buttons = self.driver.find_elements(By.XPATH, "//button[contains(., 'Add Device')]")
        
        # Use the last one (modal submit button, not the page "+ Add Device" button)
        if len(add_device_buttons) < 2:
            raise Exception("Submit button not found in modal")
        
        submit_btn = add_device_buttons[-1]  # Last button with "Add Device"
        
        self.driver.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
        time.sleep(0.3)
        
        try:
            submit_btn.click()
        except Exception:
            # Fallback to JavaScript click
            self.driver.execute_script("arguments[0].click();", submit_btn)
        
        time.sleep(2)

    def get_inline_error(self):
        try:
            return self.get_text(self.INLINE_ERROR)
        except Exception:
            return ""

    def get_toast_message(self):
        import time
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        time.sleep(1)  # Initial wait for toast to appear
        try:
            # Wait for toast to be visible (with 5 second timeout)
            wait = WebDriverWait(self.driver, 5)
            element = wait.until(EC.visibility_of_element_located(self.TOAST_MESSAGE))
            msg = element.text.strip()
            return msg if msg else ""
        except Exception as e:
            # If no toast found, return empty string
            return ""
