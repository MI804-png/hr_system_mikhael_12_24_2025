declare module 'nodemailer' {
  interface TransportOptions {
    service?: string;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  interface MailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<any>;
  }

  function createTransport(options: TransportOptions): Transporter;

  export { createTransport, Transporter, MailOptions };
}
