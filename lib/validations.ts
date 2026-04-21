import { z } from "zod"

// Auth Schemas
export const loginSchema = z.object({
  id: z
    .string()
    .min(1, "Email, phone, or username is required")
    .max(255, "Input is too long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(val),
        "Please enter a valid phone number"
      ),
    country: z
      .string()
      .min(1, "Country is required")
      .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    //   "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    // ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Checkout Schemas
export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  address1: z.string().min(1, "Address is required").max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State/Province is required").max(100),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20)
    .regex(/^[A-Za-z0-9\s-]+$/, "Invalid postal code format"),
  country: z.string().min(1, "Country is required").max(100),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, "Invalid phone number"),
})

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .regex(/^\d{13,19}$/, "Invalid card number"),
  cardName: z.string().min(1, "Name on card is required").max(100),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date (MM/YY)"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .regex(/^\d{3,4}$/, "Invalid CVV"),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

// Contact Schema
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
})

export type ContactFormData = z.infer<typeof contactSchema>

// Review Schema
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  title: z.string().min(1, "Title is required").max(100),
  content: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review is too long"),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// Newsletter Schema
export const newsletterSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

export type NewsletterFormData = z.infer<typeof newsletterSchema>

// Profile Schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(val),
      "Invalid phone number"
    ),
  bio: z.string().max(500, "Bio is too long").optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Vendor Product Schema
export const vendorProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().min(1, "Category is required"),
  brand_id: z.string().optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  original_price: z.number().optional(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().min(1, "SKU is required").max(50),
  tags: z.array(z.string()).optional(),
})

export type VendorProductFormData = z.infer<typeof vendorProductSchema>
