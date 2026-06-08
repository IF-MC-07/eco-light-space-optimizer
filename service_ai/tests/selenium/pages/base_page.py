from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from tests.config import BASE_URL

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
        self.base_url = BASE_URL

    def open_url(self, path):
        self.driver.get(f"{self.base_url}{path}")

    def find_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def click_element(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def enter_text(self, locator, text):
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator):
        return self.find_element(locator).text

    def wait_for_url_contains(self, text):
        self.wait.until(EC.url_contains(text))

    def is_element_displayed(self, locator):
        try:
            return self.find_element(locator).is_displayed()
        except TimeoutException:
            return False
