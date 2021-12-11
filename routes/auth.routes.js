const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const router = Router();
const User = require("../models/User");

// /api/auth/register
router.post(
    "/register",
    [
        check("email", "Incorrect Email").isEmail(),
        check("password", "Min lenght - 6 symbols").isLength({ min: 6 }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: "Incorrect registration data",
                });
            }
            const { email, password } = req.body;

            const candidate = await User.findOne({ email });

            if (candidate) {
                return res.status(400).json({
                    message: "Такой пользователь уже существует",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({ email, password: hashedPassword });

            await user.save();

            res.status(201).json({ message: "User has been created" });
        } catch (e) {
            res.status(500).json({ message: "Что-то не так, пробуй еще раз" });
        }
    }
);

// /api/auth/login
router.post(
    "/login",
    [
        check("email", "Plz Enter correct Email").normalizeEmail().isEmail(),
        check("password", "Enter the password").exists(),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: "Incorrect entering data",
                });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json("Wrong answer, try again");
            }
            console.log(config);

            const token = jwt.sign(
                { userId: user.id },
                config.get("jwtSecret"),
                { expiresIn: "365d" }
            );

            res.json({ token, userId: user.id });
        } catch (e) {
            res.status(500).json({
                message: `Что-то не так, пробуй еще раз ${e}`,
            });
        }
    }
);
module.exports = router;
