from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class MonitoringPage(BasePage):
    ENERGY_PANEL = (By.CSS_SELECTOR, "[data-testid='energy-panel']")
    SENSOR_WARNING = (By.CSS_SELECTOR, "[data-testid='sensor-warning']")
    MULTI_PANEL_CONTAINER = (By.CSS_SELECTOR, "[data-testid='multi-panel-container']")

    def load(self):
        self.open_url("/admin/monitoring")

    def is_energy_panel_displayed(self):
        return self.is_element_displayed(self.ENERGY_PANEL)

    def get_sensor_warning_text(self):
        return self.get_text(self.SENSOR_WARNING)

    def is_multi_panel_displayed(self):
        return self.is_element_displayed(self.MULTI_PANEL_CONTAINER)
