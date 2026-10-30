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
 * what is withheld is the button, until the model reads the image too
 * (stoa-backend#135) and a smoke run on production has sent one. Opening it
 * is #512's: here, a module of its own so tests can drive the buttons with
 * it on (#509).
 */
export const ATTACHMENTS_WORK = false
