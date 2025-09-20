
const { Builder, By, Key, until } = require('selenium-webdriver');
const { Options } = require('selenium-webdriver/chrome');

// Increase Jest timeout for Selenium tests
jest.setTimeout(30000);

describe('Task Manager UI', () => {
    let driver;

    beforeAll(async () => {
        const options = new Options();
        // options.headless(); // Run in headless mode
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('should add a new task successfully', async () => {
        await driver.get('http://localhost:3000/');

        const titleInput = await driver.findElement(By.css('input[placeholder="Add Task Title"]'));
        const descriptionInput = await driver.findElement(By.css('input[placeholder="Add Task Description"]'));
        const addButton = await driver.findElement(By.css('input[type="submit"]'));

        const taskTitle = 'New Selenium Task';
        const taskDesc = 'This is a test task from Selenium';

        await titleInput.sendKeys(taskTitle);
        await descriptionInput.sendKeys(taskDesc);
        await addButton.click();

        // Wait for the task to appear in the list
        await driver.wait(until.elementLocated(By.xpath(`//strong[text()='${taskTitle}']`)), 10000);

        const taskElement = await driver.findElement(By.xpath(`//strong[text()='${taskTitle}']`));
        expect(await taskElement.getText()).toBe(taskTitle);
    });

    test('should show an error when adding a task with an empty title', async () => {
        await driver.get('http://localhost:3000/');

        const addButton = await driver.findElement(By.css('input[type="submit"]'));
        await addButton.click();

        // Wait for the alert to appear
        await driver.wait(until.alertIsPresent(), 10000);

        // Switch to the alert
        const alert = await driver.switchTo().alert();

        // Get the text from the alert
        const alertText = await alert.getText();

        // Assert the text is correct
        expect(alertText).toBe('Please add a task title.');

        // Dismiss the alert
        await alert.accept();
    });
});
