import { Asset } from "./asset.ts";

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

export async function newBooking() {

  

}
