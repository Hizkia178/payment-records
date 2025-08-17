"use server"

import { PrismaClient } from "@prisma/client";
import { Payment } from "./types";

const validStatuses = ["pending", "processing", "success", "failed"] as const;
export type Status = typeof validStatuses[number]; 

const prisma = new PrismaClient();

export async function getPayments(): Promise<Payment[]> {
  const payments = await prisma.payment.findMany();
  return payments.map(payment => ({
    ...payment,
    status: payment.status as Status 
  }));
}

export async function createPayment(data: { id: string; amount: number; status: string; email: string }): Promise<Payment> {
  if (!validStatuses.includes(data.status as Status)) {
    throw new Error(`Status tidak valid: ${data.status}. Harus salah satu dari ${validStatuses.join(", ")}`);
  }

  const payment = await prisma.payment.create({
    data,
  });

  return {
    ...payment,
    status: payment.status as Status,
  };
}

export async function deletePayment(id: string) {
  return await prisma.payment.delete({
    where: { id },
  });
}