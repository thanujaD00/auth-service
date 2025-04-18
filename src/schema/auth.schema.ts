import { object, string, TypeOf } from "zod";

export const createUserSignUpSchema = object({
  body: object({
    firstName: string({
      required_error: "First name is required",
    })
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50, { message: "First name must be at most 50 characters" }),
    lastName: string({
      required_error: "Last name is required",
    })
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50, { message: "Last name must be at most 50 characters" }),
    email: string({
      required_error: "Email is required",
    }).email({ message: "Email must be a valid email address" }),
    password: string({
      required_error: "Password is required",
    })
      .min(6, { message: "Password must be at least 6 characters" })
      .max(50, { message: "Password must be at most 50 characters" }),
    confirmPassword: string({
      required_error: "Confirm password is required",
    })
      .min(6, { message: "Confirm password must be at least 6 characters" })
      .max(50, { message: "Confirm password must be at most 50 characters" }),
    contactNo: string({
      required_error: "Contact number is required",
    }).length(10, { message: "Contact number must be exactly 10 digits" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Confirm Password and Password do not match",
    path: ["confirmPassword"],
  }),
});

export const createUserSignInSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email({ message: "Email must be a valid email address" }),
    password: string({
      required_error: "Password is required",
    })
      .min(6, { message: "Password must be at least 6 characters" })
      .max(50, { message: "Password must be at most 50 characters" }),
  }),
});

export const forgotPasswordSchema = object({
  body: object({
    email: string({
      required_error: "Email is required",
    }).email({ message: "Email must be a valid email address" }),
  }),
});

export const resetPasswordSchema = object({
  body: object({
    password: string({
      required_error: "Password is required",
    })
      .min(6, { message: "Password must be at least 6 characters" })
      .max(50, { message: "Password must be at most 50 characters" }),
    confirmPassword: string({
      required_error: "Confirm password is required",
    })
      .min(6, { message: "Confirm password must be at least 6 characters" })
      .max(50, { message: "Confirm password must be at most 50 characters" }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Confirm Password and Password do not match",
    path: ["confirmPassword"],
  }),
});

export const updateUserProfileSchema = object({
  body: object({
    firstName: string()
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50, { message: "First name must be at most 50 characters" })
      .optional(),
    lastName: string()
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50, { message: "Last name must be at most 50 characters" })
      .optional(),
    contactNo: string()
      .min(10, { message: "Contact number must be at least 10 characters" })
      .max(10, { message: "Contact number must be at most 10 characters" })
      .optional(),
    address: object({
      street: string()
        .min(2, { message: "Street must be at least 2 characters" })
        .max(150, { message: "Street must be at most 150 characters" }),
      city: string()
        .min(2, { message: "City must be at least 2 characters" })
        .max(50, { message: "City must be at most 50 characters" }),
      postalCode: string()
        .min(2, { message: "Postal code must be at least 2 characters" })
        .max(10, { message: "Postal code must be at most 10 characters" }),
      province: string()
        .min(2, { message: "Province must be at least 2 characters" })
        .max(50, { message: "Province must be at most 50 characters" }),
    }).optional(),
  }),
});

// Schema for updating user to seller
export const updateUserToSellerSchema = object({
  body: object({
    storeName: string({
      required_error: "Store Name is required",
    })
      .min(2, { message: "Store name must be at least 2 characters" })
      .max(75, { message: "Store name must be at most 75 characters" }),
    description: string({
      required_error: "Description is required",
    })
      .min(2, { message: "Description must be at least 2 characters" })
      .max(200, { message: "Description must be at most 200 characters" }),
    logo: string().optional(),
  }),
});

export type CreateUserSignUpInput = TypeOf<typeof createUserSignUpSchema>;
export type CreateUserSignInInput = TypeOf<typeof createUserSignInSchema>;
export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>;
export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>;
export type UpdateUserProfileInput = TypeOf<typeof updateUserProfileSchema>;
export type UpdateUserToSellerInput = TypeOf<typeof updateUserToSellerSchema>;
