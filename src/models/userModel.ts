import crypto from "crypto";
import { Document, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

// DEFINE THE USER TYPESCRIPT INTERFACE
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active: boolean;

  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

// Build the Mongoose Schema matching the interface definitions
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email!"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: [8, "A password must have 8 or more characters!"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    validate: {
      validator: function (this: IUser, el: string): boolean {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// PASSWORD ENCRYPTION HOOK
userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

// PASSWORD RESET TIMING HOOK
userSchema.pre("save", function (this: IUser) {
  if (!this.isModified("password") || this.isNew) return;
  this.passwordChangedAt = new Date(Date.now() - 1000);
});

// ACTIVE USERS FILTER MIDDLEWARE
userSchema.pre(/^find/, function (this: any) {
  this.find({ active: { $ne: false } });
});

// INSTANCE METHOD: Verify incoming Login Password
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// INSTANCE METHOD: Check if Password changed After JWT Issuance
userSchema.methods.changedPasswordAfter = function (
  this: IUser,
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString(),
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// INSTANCE METHOD: Generate Secure Hex Password Reset Tokens
userSchema.methods.createPasswordResetToken = function (this: IUser): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

export const User = model<IUser>("User", userSchema);
