from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage

class MonitoringPage(BasePage):
    ENERGY_PANEL = (By.XPATH, "//h1[contains(text(), 'Energy Monitor')]")
    SENSOR_WARNING = (By.TAG_NAME, "body")
    MULTI_PANEL_CONTAINER = (By.CSS_SELECTOR, ".grid")

    def load(self):
        self.open_url("/energy-monitor")

    def is_energy_panel_displayed(self):
        return self.is_element_displayed(self.ENERGY_PANEL)

    def get_sensor_warning_text(self):
        return self.get_text(self.SENSOR_WARNING)

    def is_multi_panel_displayed(self):
        return self.is_element_displayed(self.MULTI_PANEL_CONTAINER)
