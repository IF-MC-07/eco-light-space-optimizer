from selenium.webdriver.common.by import By
from tests.selenium.pages.base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "[role='alert']")

    def load(self):
        self.open_url("/login")

    def login(self, email, password):
        self.enter_text(self.EMAIL_INPUT, email)
        self.enter_text(self.PASSWORD_INPUT, password)
        self.click_element(self.SUBMIT_BUTTON)

    def get_error_message(self):
        from selenium.webdriver.support import expected_conditions as EC
        element = self.wait.until(EC.visibility_of_element_located(self.ERROR_MESSAGE))
        return element.text
