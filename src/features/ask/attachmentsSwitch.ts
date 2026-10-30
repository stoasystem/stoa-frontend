/**
 * The paperclip, the camera and a teacher's "Add picture" are on.
 *
 * Measured against production on 2026-10-11, signed in as two different
 * accounts: `POST /files/intents` answers 200, `PUT /files/{id}/chunks/1`
 * answers 200, and `POST /files/{id}/complete` answers 200 with
 * `{"status":"validated","attachment":null}` -- every time, however often it
 * is called. That answer is the design, not the fault: the attachment is made
 * when a message carries `{uploadId}`, and `uploadFile` takes `validated` as
 * done and the message sends the upload's id (#495, #507).
 *
 * The smoke run on production that this waited for passed on 2026-10-30
 * (#512, its record in the issue): a large photo straight to S3 without the
 * token, the model reading it, the attachment read back after a reload, a
 * HEIC, moderation's refusal said in English and German with the question
 * still sent, and a PDF in two parts. Still a person's to check once this is
 * live: the camera button opening the back camera on a real phone (#509), and
 * a teacher's reply with a picture (#513).
 *
 * A module of its own so tests can drive the buttons either way (#509);
 * `tests/e2e-dist/attachments.spec.ts` and `teacherReplyImages.spec.ts` open
 * the chooser from the button while it is on.
 */
export const ATTACHMENTS_WORK = true
