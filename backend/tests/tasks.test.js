const request = require('supertest');
    const mongoose = require('mongoose');
    const { app, server } = require('../server');

    // Close the server and database connection after all tests are done
    afterAll(async () => {
        await server.close();
        await mongoose.connection.close();
    });

    describe('Tasks API', () => {
        // Test for POST /api/tasks
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Test Task',
                    description: 'Test Description'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('title', 'Test Task');
        });

        // Test for input validation
        it('should not create a task with an empty title', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: '',
                    description: 'Test Description'
                });
            expect(res.statusCode).toEqual(400);
        });

        // Test for BUG-001: Invalid data type for description
        it('should return a 400 error for invalid data types', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({
                    title: 'Valid Title',
                    description: 12345 // Invalid data type
                });
            expect(res.statusCode).toEqual(400);
        });
    });