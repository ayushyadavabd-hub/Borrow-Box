import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const isCollegeEmail = (email) => {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized || !normalized.includes("@")) return false;

  const domain = normalized.split("@")[1];
  if (!domain) return false;

  const allowedDomainPatterns = [
    /(?:^|\.)edu(?:\.|$)/i,
    /(?:^|\.)edu\.in(?:\.|$)/i,
    /(?:^|\.)ac\.in(?:\.|$)/i,
    /(?:^|\.)student(?:\.|$)/i,
    /(?:^|\.)college(?:\.|$)/i,
    /(?:^|\.)university(?:\.|$)/i,
    /(?:^|\.)campus(?:\.|$)/i,
  ];

  return allowedDomainPatterns.some((pattern) => pattern.test(domain));
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, hostel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (!isCollegeEmail(email)) {
      return res
        .status(400)
        .json({ message: "Only college email addresses are allowed" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = await User.create({ name, email, password, hostel });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      hostel: user.hostel,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        hostel: user.hostel,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
