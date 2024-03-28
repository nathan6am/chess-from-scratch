import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type * as React from "react";

/**
 * Merges class names with tailwindcss classes
 * @param classes
 * @returns class names string
 */
const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));
export default cn;
