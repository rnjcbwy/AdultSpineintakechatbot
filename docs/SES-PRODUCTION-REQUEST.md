# Amazon SES: request production access (account 933164653563, us-east-1)

**Status 2026-10-21:** case 179227456900079 ("SES: Production Access") was not closed; AWS's automated
review had asked for six details. The reply below was posted on the case on 2026-10-21 18:10 EDT from the
Support Center. AWS answers on the case and by email to the account root address and admin@aaronweymd.com,
usually within a day. Check: `aws sesv2 get-account --region us-east-1 --query ProductionAccessEnabled`.
If AWS asks for more, reply on the same case (Support Center → Your support cases).

**Sender changed after the reply (2026-10-21):** patient email now comes from `no-reply@aaronweymd.com`
("Dr. Aaron Wey's office"), not spine@. Every message says not to reply and gives the office number.
Production access is granted for the whole account and the verified domain, so the change does not affect
the case. If AWS asks, say the sender is no-reply@aaronweymd.com and questions go to (201) 836-1663.

The account is still in the SES **sandbox**: it can only send to addresses or domains that are
verified in SES. `aaronweymd.com` is verified (DKIM passing), so mail to any `@aaronweymd.com`
address already works; mail to a patient's Gmail or Yahoo address is refused until AWS grants
production access. An earlier request (case 179227456900079, from the Practice Hub setup) was
**denied**, and the API will not accept a second request, so this one has to go through the console.

## Where

1. Sign in to the AWS console as the account owner.
2. Open **Amazon SES** → **Account dashboard** (region N. Virginia, us-east-1).
3. The banner "Your Amazon SES account is in the sandbox" has a **Request production access**
   button (or **View case** / **Edit account details** if the old case is shown; use the option that
   starts a new request).
4. Fill in the form with the text below and submit. AWS usually answers within 24 hours by email
   to the account's root email and to the additional contact.

## What to enter

- **Mail type:** Transactional
- **Website URL:** https://aaronweymd.com
- **Additional contact addresses:** admin@aaronweymd.com, aaronj.wey@gmail.com
- **Preferred contact language:** English
- **Use case description** (paste as is):

> I am a physician (Aaron Wey, MD, adult and pediatric spine surgery, 870 Palisade Ave, Teaneck,
> NJ; public website https://aaronweymd.com). Two applications in this account send one-to-one
> transactional email from spine@aaronweymd.com, a verified domain identity with DKIM:
>
> 1. intake.aaronweymd.com: when a patient requests an appointment on our website and gives us
>    their email address, they receive one message with the private link to the pre-visit
>    questionnaire they asked for.
> 2. Our internal office portal: when a referring physician submits a referral, the referred
>    patient receives one intake invitation, and a new referring physician receives one sign-in
>    link they requested.
>
> Every message is triggered by the recipient's own request or by their physician's referral.
> There are no mailing lists, newsletters, marketing or purchased addresses, and no message is
> sent more than once per event. Expected volume is under 100 messages per day and well under
> 2,000 per month. Bounces and complaints: the SES account-level suppression list is enabled;
> bounce and complaint notifications go to the office mailbox and the address is removed from
> our records. Recipients can reply directly to spine@aaronweymd.com, which is staffed by the
> office. The applications run in this account under the AWS Business Associate Addendum.

## After approval

Nothing else to change: both apps send from `no-reply@aaronweymd.com`
(`cdk.json` → `emailFrom` for the intake app; the default of `email_from` in
`deploy/terraform/ses.tf` for Practice Hub). Send one test from the website chat to a Gmail address to confirm.
