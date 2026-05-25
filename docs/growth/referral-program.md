# Referral frontend flow

Phase 11 supports a demo referral flow:

- `GET /referrals/me` returns invite code, invite URL, and successful invite count.
- `/referrals` shows the invite link and copy action.
- `/register?ref=CODE` stores the referral code in localStorage.
- Registration payload can include `referralCode`.

Rewards are placeholders until paid launch backend rules exist.
