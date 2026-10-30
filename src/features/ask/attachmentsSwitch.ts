/**
 * The paperclip stays off until the upload pipeline hands back an attachment.
 *
 * Measured against production on 2026-10-11, signed in as two different
 * accounts: `POST /files/intents` answers 200, `PUT /files/{id}/chunks/1`
 * answers 200, and `POST /files/{id}/complete` answers 200 with
 * `{"status":"validated","attachment":null}` -- every time, however often it
 * is called. `GET /files/attachments` answers 503 `upload_service_unavailable`.
 * That answer is the design, not the fault: the attachment is made when a
 * message carries `{uploadId}`, and `uploadFile` now takes `validated` as done
 * and the message sends the upload's id (#495, #507).
 *
 * The picker, the tray, the limits and their tests are all here and tested;
 * what is withheld is the button. The backend side is live since 2026-10-29:
 * the model reads the image (stoa-backend#135) and moderation refuses one as
 * `upload_content_blocked` (#138, said in the tray since #512). What is left is
 * a smoke run on production that sends one -- its checklist is in #512's PR.
 * Then this turns `true`: a module of its own so tests can drive the buttons
 * with it on (#509), and `tests/e2e-dist/attachments.spec.ts` opens the
 * chooser from the button once it is.
 */
export const ATTACHMENTS_WORK = false
