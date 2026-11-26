import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateRegister, validateLogin } from '../validators/authValidator';
import validate from '../middlewares/validateMiddleware';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimitMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully. Standard ApiResponse with data = { user, token }
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Too many attempts from this IP, try again later
 */
router.post('/register', registerLimiter, validateRegister, validate, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful. Standard ApiResponse with data = { user, token }
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many failed login attempts from this IP, try again later
 */
router.post('/login', loginLimiter, validateLogin, validate, authController.login);

export default router;
