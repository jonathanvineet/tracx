// src/utils/resendClient.js
import { Resend } from "resend";

const resend = new Resend("re_LoSiNvYH_N64ky5kVC1x6L4mqfbRau4b5");

export const sendOtpEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "tracx.2006@gmail.com",
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });
    console.log("Email sent!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
