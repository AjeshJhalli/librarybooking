import { Asset } from "./asset.ts";

const kv = await Deno.openKv();

export type Question = QuestionFreetext | QuestionDropdown;

export type QuestionFreetext = {
  question: string;
};

export type QuestionDropdown = {
  question: string;
  answers: QuestionDropdownAnswer[];
};

export type QuestionDropdownAnswer = {
  answer: string;
  points: number;
};

export type BookingForm = {
  questions: Question[];
};

export type Booking = {
  bookingId: string;
  userId: string;
  startDate: number;
  endDate: number;
  bookingScore: number;
  assets: Asset[];
};

export async function newBooking(userId: string, booking: Booking) {
  await kv.set(["bookings", userId, booking.bookingId], booking);
}


export async function getBookings(userId: string) {
  const bookings = (await Array.fromAsync(await kv.list({ prefix: ["bookings", userId] }))).map(booking => booking.value);

  return bookings;
}