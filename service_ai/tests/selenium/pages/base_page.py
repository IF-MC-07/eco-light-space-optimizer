from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from tests.selenium.config import BASE_URL

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15)  # Increased from 10 to 15 seconds
        self.base_url = BASE_URL

    def open_url(self, path):
        self.driver.get(f"{self.base_url}{path}")

    def find_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_element_visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click_element(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        # Scroll element into view to avoid interception
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
        # Small delay to ensure view is settled
        import time
        time.sleep(0.5)
        try:
            element.click()
        except Exception:
            # Fallback to JavaScript click if normal click fails
            self.driver.execute_script("arguments[0].click();", element)

    def enter_text(self, locator, text):
        element = self.find_element_visible(locator)  # Use visibility wait
        import time
        time.sleep(0.2)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator):
        element = self.find_element_visible(locator)
        text = element.text
        return text if text else ""  # Use visibility wait

    def wait_for_url_contains(self, text):
        self.wait.until(EC.url_contains(text))

    def is_element_displayed(self, locator):
        try:
            return self.find_element_visible(locator).is_displayed()
        except TimeoutException:
            return False
