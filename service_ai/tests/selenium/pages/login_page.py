from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[data-testid='email-input']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[data-testid='password-input']")
    SUBMIT_BUTTON = (By.CSS_SELECTOR, "button[data-testid='login-button']")
    ERROR_MESSAGE = (By.CSS_SELECTOR, "[data-testid='login-error']")

    def load(self):
        self.open_url("/login")

    def login(self, email, password):
        self.enter_text(self.EMAIL_INPUT, email)
        self.enter_text(self.PASSWORD_INPUT, password)
        self.click_element(self.SUBMIT_BUTTON)

    def get_error_message(self):
        return self.get_text(self.ERROR_MESSAGE)
