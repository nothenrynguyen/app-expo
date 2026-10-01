# GoatCounter provider clarification

Prepared September 30, 2026. Not sent. Recipient: support@goatcounter.com.

Subject: Free hosted analytics, usage enforcement and minimal data configuration

Hello,

I run App Expo, a public, non-commercial job board at https://app-expo-one.vercel.app/. I operate it from the US and promote it mainly to US job seekers. It is a personal project shared with my LinkedIn connections, potentially hundreds of people. Browsing requires no account. I would like to use GoatCounter's hosted service for page counts and aggregate counts of collection selection, filter usage, outbound Apply clicks, and Save/Unsave clicks.

The project has a strict zero-cost policy: no payment method, automatic paid upgrade, paid trial conversion, invoice or billable overage. Your terms say reasonable public usage is free, and your FAQ says you prefer contacting high-volume users before shutting down their accounts. Could you confirm what happens if usage becomes excessive, and that collection would only be restricted or stopped unless I explicitly enter a separate paid agreement? Is there a practical numerical allowance or request-rate limit I should plan around for page views plus custom events?

I propose disabling Sessions, Individual pageviews, browser/OS, location, language and screen-size collection, and setting retention to 90 days. My browser integration would send only fixed page paths/event names, no query strings, no job IDs, no search text or notes, and origin-only referrals on page views. It would honor opt-out and browser privacy signals. The dashboard would be private.

Could you confirm:

1. These settings are available on the free hosted service, including 90-day retention, and how timed deletion applies to aggregate tables and backups.
2. With sessions disabled both site-wide and per request, no IP/User-Agent visitor mapping is created, and with Individual pageviews disabled, ordinary visitor requests are stored only as aggregate counts.
3. What operational/access/error logs and bot records remain, including their fields and retention. The current upstream changelog mentions a bot table retained for 30 days; does that apply to the hosted service even with Individual pageviews disabled?
4. Whether visitor information is processed only for the publisher's requested analytics, without independent reuse, cross-site joining or disclosure beyond hosting subprocessors, and what processing agreement or other supporting documentation you provide for an audience-measurement exemption assessment.

Thank you.
