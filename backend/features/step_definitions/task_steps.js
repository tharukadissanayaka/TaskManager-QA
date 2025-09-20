const { Given, When, Then, AfterAll, BeforeAll } = require('@cucumber/cucumber');
    const { expect } = require('chai');
    const request = require('supertest');
    const mongoose = require('mongoose');
    const { app, server } = require('../../server');
    const Task = require('../../models/Task');

    let response;
    let taskData;

    BeforeAll(async () => {
        await Task.deleteMany({});
    });

    // Close server and DB connection
    AfterAll(async () => {
        await mongoose.connection.close();
        server.close();
    });

    Given('I have a title {string} and a description {string}', function (title, description) {
        taskData = { title, description };
    });

    When('I send a POST request to {string}', async function (url) {
        response = await request(app).post(url).send(taskData);
    });

    Then('the response status code should be {int}', function (statusCode) {
        expect(response.statusCode).to.equal(statusCode);
    });

    Then('the response should contain the new task with title {string}', function (title) {
        expect(response.body.title).to.equal(title);
    });