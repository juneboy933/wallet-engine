import { loginUser, registerUser } from "./auth.service.js";
import { userSchema } from "./auth.validation.js";

export const register = async (req, res) => {
  const validation = userSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }

  const { email, password } = validation.data;
  const result = await registerUser({ email, password });
  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }
  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
  });
};

export const login = async (req, res) => {
  const validation = userSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: validation.error.format(),
    });
  }

  const { email, password } = validation.data;
  const result = await loginUser({ email, password });
  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
};
