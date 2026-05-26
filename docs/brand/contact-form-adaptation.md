# Contact Form Adaptation

## Source Observation

The company homepage contact page uses a direct contact form with name, email, phone, subject, and message fields. It also validates required fields, prevents duplicate submissions, and displays success or failure feedback.

## Learning Platform Adaptation

The learning platform contact page adapts the structure for product needs:

- Name
- Email
- Phone, optional
- Role
- Topic
- Message
- Preferred language

Role options:

- Parent
- Student
- Teacher
- School or tutoring center
- Other

Topic options:

- Learning platform
- Professional teacher support
- Parent reports
- Pricing
- Teacher application
- School partnership
- Technical support
- Other

## API Contract

The frontend submits to:

```text
POST /contact/requests
```

Request:

```json
{
  "name": "Michael Keller",
  "email": "michael@example.com",
  "phone": "+41 ...",
  "role": "parent",
  "topic": "parent_reports",
  "message": "I would like to learn more about STOA for my child.",
  "preferredLanguage": "de"
}
```

Response:

```json
{
  "ok": true,
  "requestId": "contact-request-..."
}
```

## Implementation Notes

- `ContactForm` uses localized labels and validation messages.
- Submit is disabled while the request is pending to prevent duplicate submissions.
- Success and error states use accessible live/status regions.
- The local backend validates required fields, email format, role, and topic.
- No production email sending, CRM integration, or anti-spam system is implemented in this phase.
