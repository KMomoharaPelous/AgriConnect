const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
        const validUser = {
            name: 'Jane Doe',
            username: 'farmer_jane',
            displayName: 'Janes Southside Ranch',
            email: 'jane@example.com',
            password: 'passWord123!',
            location: 'Southside, TX',
            farmType: 'small-scale'
        };

        test('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toMatchObject({
                name: validUser.name,
                username: validUser.username,
                displayName: validUser.displayName,
                email: validUser.email,
                location: validUser.location,
                farmType: validUser.farmType
            });
            expect(response.body.user).not.toHaveProperty('password');
        });

        test('should reject registration with missing required fields', async () => {
            const invalidUser = {
                name: 'John Smith',
                email: 'john@example.com',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body.message).toContain('Please provide name, username, email, and password');
        });

        test('should reject duplicate email', async () => {
            // Create first user
            await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect(201);
            
            // Try to create another user with the same email
            const duplicateEmailUser = {
                ...validUser,
                username: 'different_username'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateEmailUser)
                .expect(400);

            expect(response.body.message).toBe('Email already registered');
        });

        test('should reject duplicate username', async () => {
            // create first user
            await request(app)
                .post('/api/auth/register')
                .send(validUser)
                .expect(201);

            // Try to create another user with the same username
            const duplicateUsernameUser = {
                ...validUser,
                email: 'different_email@example.com'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateUsernameUser)
                .expect(400);

            expect(response.body.message).toBe('Username already taken')
        });

        test('should default displayName to name if not provided', async () => {
            const userWithoutDisplayName = {
                name: 'John Appleseed',
                username: 'john_appleseed',
                email: 'johnny@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userWithoutDisplayName)
                .expect(201);

            expect(response.body.user.displayName).toBe(userWithoutDisplayName.name);
        });
    });
});

describe('POST /api/auth/login', () => {
    const testUser = {
        name: 'John Smith',
        username: 'farmer_john',
        email: 'john@example.com',
        password: 'Password123!',
        farmType: 'small-scale'
    };

    beforeEach(async () => {
        await request(app)
            .post('/api/auth/register')
            .send(testUser)           
    });

    test('should login with email successfully', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                emailOrUsername: testUser.email,
                password: testUser.password
            })
            .expect(200);

        expect(response.body).toHaveProperty('message', 'Login Successful');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.username).toBe(testUser.username);
    });

    test('should reject login with wrong password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                emailOrUsername: testUser.email,
                password: 'WrongPassword!'
            })
            .expect(401);

        expect(response.body.message).toBe('Invalid credentials');
    });

    test('should reject login with non-existent user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                emailOrUsername: 'nonexistent@example.com',
                password: 'Password123!'
            })
            .expect(401);

        expect(response.body.message).toBe('Invalid credentials');
    });

    test('should reject login with missing credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                emailOrUsername: testUser.email,
                // missing password
            })
            .expect(400);

        expect(response.body.message).toBe('Please provide email/username and password')
    });
});