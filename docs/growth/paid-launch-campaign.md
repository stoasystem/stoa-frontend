# Paid launch campaign tracking

The frontend captures whitelisted attribution keys:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `ref`

These values are stored locally and can be attached to registration, checkout, and analytics events. Student chat content, file content, support body text, and sensitive learning material are not added to analytics payloads.
